-- Phase 6.5 P0-3: application creation, identity, and actor-transition
-- integrity.
--
-- Purpose
--   1. Applications may be created only by an ACTIVE eligible applicant,
--      against a currently published, non-admin-unpublished, non-deleted
--      opportunity.
--   2. Application identity columns are immutable after INSERT.
--   3. Status changes are authorized by actor, not only by the generic graph:
--        ENGINEER/INSTRUCTOR: own application -> withdrawn only
--        COMPANY: owned opportunity's forward/reject/completion transitions
--        ADMIN: the same non-withdrawal moderation graph
--   4. completed_at is written by the database only on accepted -> completed.
--
-- Duplicate prevention
--   uq_applications_opp_applicant from migration 011 remains the authoritative
--   one-application-per-opportunity/applicant boundary.
--
-- Data impact
--   None at migration time. Existing application rows are not rewritten.
--
-- RLS/security impact
--   All private SELECT/INSERT/UPDATE paths require ACTIVE. The INSERT policy
--   checks the current opportunity state. UPDATE identity protection is a
--   trigger because RLS cannot safely compare OLD and NEW values.
--
-- SECURITY DEFINER
--   None. The trigger executes as invoker, uses a fixed empty search_path,
--   schema-qualified objects, auth.uid(), and the ACTIVE-aware role helper
--   from migration 067.
--
-- Existing-data compatibility
--   Existing applications remain valid history even when their opportunity
--   was subsequently closed/unpublished. The stricter eligibility rule applies
--   only to new INSERTs.
--
-- Rollback
--   Restore policies from migration 025 and the generic transition function
--   body from migration 056. Existing data requires no rollback.

ALTER POLICY applications_select_own ON public.applications
    USING (
        (SELECT private.current_user_is_active())
        AND applicant_id = (SELECT auth.uid())
    );

ALTER POLICY applications_select_poster ON public.applications
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.opportunities o
            WHERE o.id = applications.opportunity_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY applications_insert_own ON public.applications
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND applicant_id = (SELECT auth.uid())
        AND status = 'applied'
        AND completed_at IS NULL
        AND EXISTS (
            SELECT 1
            FROM public.opportunities o
            WHERE o.id = applications.opportunity_id
              AND o.status = 'published'
              AND o.unpublished_by_admin = FALSE
              AND o.deleted_at IS NULL
              AND (
                  (
                      (SELECT private.current_user_role()) = 'ENGINEER'
                      AND o.side = 'ENGINEER'
                      AND o.contract_type IN (
                          'employment',
                          'project',
                          'hourly'
                      )
                  )
                  OR (
                      (SELECT private.current_user_role()) = 'INSTRUCTOR'
                      AND o.side = 'TRAINING'
                      AND o.contract_type = 'training'
                  )
              )
        )
    );

ALTER POLICY applications_update_withdraw ON public.applications
    USING (
        (SELECT private.current_user_is_active())
        AND applicant_id = (SELECT auth.uid())
        AND (SELECT private.current_user_role()) IN ('ENGINEER', 'INSTRUCTOR')
        AND status IN ('applied', 'screening', 'interview')
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND applicant_id = (SELECT auth.uid())
        AND (SELECT private.current_user_role()) IN ('ENGINEER', 'INSTRUCTOR')
        AND status = 'withdrawn'
    );

ALTER POLICY applications_update_poster ON public.applications
    USING (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'COMPANY'
        AND EXISTS (
            SELECT 1
            FROM public.opportunities o
            WHERE o.id = applications.opportunity_id
              AND o.posted_by = (SELECT auth.uid())
        )
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'COMPANY'
        AND EXISTS (
            SELECT 1
            FROM public.opportunities o
            WHERE o.id = applications.opportunity_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

-- Replaces the migration 056 generic graph with identity and actor-aware
-- enforcement. The existing trigger remains attached to this function.
CREATE OR REPLACE FUNCTION private.enforce_application_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_role TEXT := private.current_user_role();
    v_company_owns_application BOOLEAN;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status <> 'applied' OR NEW.completed_at IS NOT NULL THEN
            RAISE EXCEPTION 'new applications must start at applied'
                USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id
       OR NEW.opportunity_id IS DISTINCT FROM OLD.opportunity_id
       OR NEW.applicant_id IS DISTINCT FROM OLD.applicant_id
       OR NEW.applied_at IS DISTINCT FROM OLD.applied_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
        RAISE EXCEPTION 'application identity fields are immutable'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        IF NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
            RAISE EXCEPTION 'completed_at may change only on completion'
                USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END IF;

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'active account required for application transition'
            USING ERRCODE = '42501';
    END IF;

    IF v_role IN ('ENGINEER', 'INSTRUCTOR') THEN
        IF OLD.applicant_id IS DISTINCT FROM auth.uid()
           OR NEW.status <> 'withdrawn'
           OR OLD.status NOT IN ('applied', 'screening', 'interview') THEN
            RAISE EXCEPTION 'applicant is not allowed to perform this transition'
                USING ERRCODE = '42501';
        END IF;
    ELSIF v_role = 'COMPANY' THEN
        SELECT EXISTS (
            SELECT 1
            FROM public.opportunities o
            WHERE o.id = OLD.opportunity_id
              AND o.posted_by = auth.uid()
        )
        INTO v_company_owns_application;

        IF NOT v_company_owns_application THEN
            RAISE EXCEPTION 'company does not own this application'
                USING ERRCODE = '42501';
        END IF;

        IF NOT (
            (
                OLD.status = 'applied'
                AND NEW.status IN ('screening', 'rejected')
            )
            OR (
                OLD.status = 'screening'
                AND NEW.status IN ('interview', 'rejected')
            )
            OR (
                OLD.status = 'interview'
                AND NEW.status IN ('accepted', 'rejected')
            )
            OR (
                OLD.status = 'accepted'
                AND NEW.status = 'completed'
            )
        ) THEN
            RAISE EXCEPTION 'company is not allowed to perform this transition'
                USING ERRCODE = '42501';
        END IF;
    ELSIF v_role = 'ADMIN' THEN
        IF NOT (
            (
                OLD.status = 'applied'
                AND NEW.status IN ('screening', 'rejected')
            )
            OR (
                OLD.status = 'screening'
                AND NEW.status IN ('interview', 'rejected')
            )
            OR (
                OLD.status = 'interview'
                AND NEW.status IN ('accepted', 'rejected')
            )
            OR (
                OLD.status = 'accepted'
                AND NEW.status = 'completed'
            )
        ) THEN
            RAISE EXCEPTION 'admin is not allowed to perform this transition'
                USING ERRCODE = '42501';
        END IF;
    ELSE
        RAISE EXCEPTION 'role is not allowed to update applications'
            USING ERRCODE = '42501';
    END IF;

    IF NEW.status = 'completed' THEN
        NEW.completed_at := pg_catalog.now();
    ELSIF NEW.completed_at IS DISTINCT FROM OLD.completed_at THEN
        RAISE EXCEPTION 'completed_at may change only on completion'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_status_transition
    ON public.applications;
CREATE TRIGGER trg_applications_status_transition
    BEFORE INSERT OR UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_application_status_transition();

-- Verification SQL (run after application):
-- 1. ACTIVE Engineer INSERT to a published eligible opportunity succeeds with
--    status='applied'; duplicate INSERT fails with 23505.
-- 2. INSERT to draft/closed/admin-unpublished/deleted opportunity returns no
--    inserted row under RLS.
-- 3. SUSPENDED/WITHDRAWN applicant INSERT/SELECT/UPDATE returns no private row.
-- 4. Updating id/opportunity_id/applicant_id/applied_at/created_at fails 23514
--    for Engineer, Company, and Admin callers.
-- 5. Engineer may withdraw only applied/screening/interview own rows.
-- 6. Company may use only its owned forward/reject/completion graph and may
--    never set withdrawn.
-- 7. accepted -> completed stamps completed_at and preserves review eligibility.
-- 8. Existing applications whose opportunity is now closed remain selectable
--    as history by their ACTIVE applicant/company/admin.
