-- Phase 6.5 P0-2: global ACTIVE-account authorization hardening.
--
-- Purpose
--   Prevent a SUSPENDED or WITHDRAWN authenticated session from retaining
--   private owner, applicant-company, or ADMIN access through PostgREST after
--   Next.js route middleware has rejected the same account.
--
-- Strategy
--   1. Make private.current_user_role() return NULL unless the caller is
--      ACTIVE. Every existing role-based policy and trigger check therefore
--      becomes ACTIVE-aware without duplicating a status subquery.
--   2. Add private.current_user_is_active() to private policies that previously
--      relied only on auth.uid() ownership or an application relationship.
--   3. Require an ACTIVE reviewed Engineer for public review visibility and an
--      ACTIVE Engineer for public engineer_profiles visibility.
--   4. Require ACTIVE inside admin_write_audit_log(), the only pre-066 RPC that
--      checked ADMIN role directly instead of using current_user_role().
--
-- Deliberately unchanged public/read-only paths
--   company_profiles_select_all, published opportunities and their subtype /
--   required-skill reads, active master catalog reads, and public Engineer
--   portfolio/profile child reads remain readable under their existing public
--   visibility rules. An inactive caller gains no private or mutation access
--   through those public policies.
--
-- Login exception
--   users_select_own remains available to an authenticated inactive account so
--   login/session code can read its status and reject it consistently. Its
--   UPDATE policy is ACTIVE-only below.
--
-- Data impact
--   None. Policies and function definitions only.
--
-- Existing-data compatibility
--   No row validation or rewrite occurs.
--
-- Rollback
--   Restore current_user_role() from migration 020, admin_write_audit_log()
--   from migration 051, and each policy expression from its source migration.

CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
    SELECT role
    FROM public.users
    WHERE id = auth.uid()
      AND status = 'ACTIVE';
$$;

REVOKE ALL ON FUNCTION private.current_user_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.current_user_role() FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_role() TO authenticated;

-- public.users: status discovery stays readable to self; mutation and
-- applicant-company visibility require an ACTIVE caller.
ALTER POLICY users_update_own ON public.users
    USING (
        (SELECT private.current_user_is_active())
        AND id = (SELECT auth.uid())
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND id = (SELECT auth.uid())
        AND (
            SELECT private.users_protected_fields_unchanged(
                role,
                status,
                deleted_at
            )
        )
    );

ALTER POLICY users_select_applicant_company ON public.users
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = users.id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

-- Primary profile tables. Company profiles remain public per BR-18.
ALTER POLICY engineer_profiles_select_own ON public.engineer_profiles
    USING (
        (SELECT private.current_user_is_active())
        AND id = (SELECT auth.uid())
    );

ALTER POLICY engineer_profiles_select_applicant_company ON public.engineer_profiles
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = engineer_profiles.id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_profiles_select_public ON public.engineer_profiles
    USING (
        is_public = TRUE
        AND (SELECT private.is_active_engineer(engineer_profiles.id))
    );

ALTER POLICY instructor_profiles_select_own ON public.instructor_profiles
    USING (
        (SELECT private.current_user_is_active())
        AND id = (SELECT auth.uid())
    );

ALTER POLICY instructor_profiles_select_applicant_company ON public.instructor_profiles
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = instructor_profiles.id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_contact_details_select_own ON public.engineer_contact_details
    USING (
        (SELECT private.current_user_is_active())
        AND id = (SELECT auth.uid())
    );

ALTER POLICY engineer_contact_details_select_applicant_company
    ON public.engineer_contact_details
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = engineer_contact_details.id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_personal_info_select_own ON public.engineer_personal_info
    USING (
        (SELECT private.current_user_is_active())
        AND id = (SELECT auth.uid())
    );

-- Skills and qualifications.
ALTER POLICY user_skills_select_own ON public.user_skills
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY user_skills_insert_own ON public.user_skills
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY user_skills_update_own ON public.user_skills
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY user_skills_delete_own ON public.user_skills
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY user_skills_select_applicant_company ON public.user_skills
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = user_skills.user_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY user_qualifications_select_own ON public.user_qualifications
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY user_qualifications_insert_own ON public.user_qualifications
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY user_qualifications_update_own ON public.user_qualifications
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY user_qualifications_delete_own ON public.user_qualifications
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY user_qualifications_select_applicant_company
    ON public.user_qualifications
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = user_qualifications.user_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

-- Preferred conditions.
ALTER POLICY engineer_preferred_contract_types_select_own
    ON public.engineer_preferred_contract_types
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_preferred_contract_types_delete_own
    ON public.engineer_preferred_contract_types
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_preferred_contract_types_select_applicant_company
    ON public.engineer_preferred_contract_types
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = engineer_preferred_contract_types.user_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_preferred_locations_select_own
    ON public.engineer_preferred_locations
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_preferred_locations_delete_own
    ON public.engineer_preferred_locations
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_preferred_locations_select_applicant_company
    ON public.engineer_preferred_locations
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = engineer_preferred_locations.user_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

-- Work experience and technologies.
ALTER POLICY engineer_work_experiences_select_own
    ON public.engineer_work_experiences
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_work_experiences_update_own
    ON public.engineer_work_experiences
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_work_experiences_delete_own
    ON public.engineer_work_experiences
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_work_experiences_select_applicant_company
    ON public.engineer_work_experiences
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = engineer_work_experiences.user_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_work_experience_technologies_select_own
    ON public.engineer_work_experience_technologies
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.engineer_work_experiences we
            WHERE we.id =
                engineer_work_experience_technologies.work_experience_id
              AND we.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_work_experience_technologies_insert_own
    ON public.engineer_work_experience_technologies
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.engineer_work_experiences we
            WHERE we.id =
                engineer_work_experience_technologies.work_experience_id
              AND we.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_work_experience_technologies_delete_own
    ON public.engineer_work_experience_technologies
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.engineer_work_experiences we
            WHERE we.id =
                engineer_work_experience_technologies.work_experience_id
              AND we.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_work_experience_technologies_select_applicant_company
    ON public.engineer_work_experience_technologies
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.engineer_work_experiences we
            JOIN public.applications a ON a.applicant_id = we.user_id
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE we.id =
                engineer_work_experience_technologies.work_experience_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

-- Education and languages.
ALTER POLICY engineer_educations_select_own ON public.engineer_educations
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_educations_update_own ON public.engineer_educations
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_educations_delete_own ON public.engineer_educations
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_educations_select_applicant_company
    ON public.engineer_educations
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = engineer_educations.user_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_languages_select_own ON public.engineer_languages
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_languages_update_own ON public.engineer_languages
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_languages_delete_own ON public.engineer_languages
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_languages_select_applicant_company
    ON public.engineer_languages
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = engineer_languages.user_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

-- Portfolio and technologies.
ALTER POLICY engineer_portfolio_projects_select_own
    ON public.engineer_portfolio_projects
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_portfolio_projects_update_own
    ON public.engineer_portfolio_projects
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_portfolio_projects_delete_own
    ON public.engineer_portfolio_projects
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_portfolio_projects_select_applicant_company
    ON public.engineer_portfolio_projects
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = engineer_portfolio_projects.user_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_portfolio_project_technologies_select_own
    ON public.engineer_portfolio_project_technologies
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.engineer_portfolio_projects pp
            WHERE pp.id =
                engineer_portfolio_project_technologies.portfolio_project_id
              AND pp.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_portfolio_project_technologies_insert_own
    ON public.engineer_portfolio_project_technologies
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.engineer_portfolio_projects pp
            WHERE pp.id =
                engineer_portfolio_project_technologies.portfolio_project_id
              AND pp.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_portfolio_project_technologies_delete_own
    ON public.engineer_portfolio_project_technologies
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.engineer_portfolio_projects pp
            WHERE pp.id =
                engineer_portfolio_project_technologies.portfolio_project_id
              AND pp.user_id = (SELECT auth.uid())
        )
    );

ALTER POLICY engineer_portfolio_project_technologies_select_applicant_company
    ON public.engineer_portfolio_project_technologies
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.engineer_portfolio_projects pp
            JOIN public.applications a ON a.applicant_id = pp.user_id
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE pp.id =
                engineer_portfolio_project_technologies.portfolio_project_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

-- Skill assessment private rows.
ALTER POLICY skill_assessment_attempts_select_own
    ON public.skill_assessment_attempts
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY skill_assessment_attempts_select_applicant_company
    ON public.skill_assessment_attempts
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.applicant_id = skill_assessment_attempts.user_id
              AND o.posted_by = (SELECT auth.uid())
        )
    );

ALTER POLICY skill_assessment_answers_select_own
    ON public.skill_assessment_answers
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.skill_assessment_attempts sat
            WHERE sat.id = skill_assessment_answers.attempt_id
              AND sat.user_id = (SELECT auth.uid())
        )
    );

-- Opportunities: published visibility is unchanged; private owner visibility
-- requires an ACTIVE account.
ALTER POLICY opportunities_select_own ON public.opportunities
    USING (
        (SELECT private.current_user_is_active())
        AND posted_by = (SELECT auth.uid())
    );

-- Favorites, reviews, and abuse reports.
ALTER POLICY favorites_select_own ON public.favorites
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY favorites_delete_own ON public.favorites
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_reviews_select_own_company ON public.engineer_reviews
    USING (
        (SELECT private.current_user_is_active())
        AND company_user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_reviews_select_own_engineer ON public.engineer_reviews
    USING (
        (SELECT private.current_user_is_active())
        AND engineer_user_id = (SELECT auth.uid())
    );

ALTER POLICY engineer_reviews_select_public ON public.engineer_reviews
    USING (
        (SELECT private.current_user_is_active())
        AND (
            SELECT private.is_active_engineer(
                engineer_reviews.engineer_user_id
            )
        )
        AND EXISTS (
            SELECT 1
            FROM public.engineer_profiles ep
            WHERE ep.id = engineer_reviews.engineer_user_id
              AND ep.show_reviews = TRUE
        )
    );

ALTER POLICY abuse_reports_select_own ON public.abuse_reports
    USING (
        (SELECT private.current_user_is_active())
        AND reporter_id = (SELECT auth.uid())
    );

ALTER POLICY abuse_reports_insert_own ON public.abuse_reports
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND reporter_id = (SELECT auth.uid())
    );

-- ACTIVE-aware audit RPC. The caller id always comes from auth.uid(); no target
-- identity is accepted for authorization.
CREATE OR REPLACE FUNCTION public.admin_write_audit_log(
    p_action_type TEXT,
    p_target_type TEXT,
    p_target_id UUID,
    p_before_data JSONB DEFAULT NULL,
    p_after_data JSONB DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_role TEXT;
    v_status TEXT;
    v_log_id UUID;
BEGIN
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'admin_write_audit_log: no authenticated user'
            USING ERRCODE = '28000';
    END IF;

    SELECT role, status
    INTO v_role, v_status
    FROM public.users
    WHERE id = v_admin_id;

    IF v_role IS DISTINCT FROM 'ADMIN'
       OR v_status IS DISTINCT FROM 'ACTIVE' THEN
        RAISE EXCEPTION 'admin_write_audit_log: active ADMIN required'
            USING ERRCODE = '42501';
    END IF;

    IF p_action_type IS NULL
       OR pg_catalog.length(pg_catalog.btrim(p_action_type)) = 0 THEN
        RAISE EXCEPTION 'admin_write_audit_log: action_type is required'
            USING ERRCODE = '22023';
    END IF;

    IF p_target_type IS NULL
       OR pg_catalog.length(pg_catalog.btrim(p_target_type)) = 0 THEN
        RAISE EXCEPTION 'admin_write_audit_log: target_type is required'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.admin_audit_logs (
        admin_user_id,
        action_type,
        target_type,
        target_id,
        before_data,
        after_data,
        reason
    )
    VALUES (
        v_admin_id,
        p_action_type,
        p_target_type,
        p_target_id,
        p_before_data,
        p_after_data,
        p_reason
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_write_audit_log(
    TEXT, TEXT, UUID, JSONB, JSONB, TEXT
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_write_audit_log(
    TEXT, TEXT, UUID, JSONB, JSONB, TEXT
) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_write_audit_log(
    TEXT, TEXT, UUID, JSONB, JSONB, TEXT
) TO authenticated;

-- Verification SQL (run after application):
-- 1. As each SUSPENDED/WITHDRAWN QA session, private SELECT/INSERT/UPDATE/
--    DELETE requests above return zero rows or 403, including ADMIN policies.
-- 2. SELECT private.current_user_role(); returns NULL for inactive callers and
--    the stored role for ACTIVE callers.
-- 3. users_select_own still returns the inactive caller's own role/status row.
-- 4. Anonymous/public reads of published opportunities and company profiles
--    retain their pre-migration results.
-- 5. SELECT * FROM pg_policies WHERE schemaname = 'public' confirms the altered
--    policies contain current_user_is_active or the ACTIVE-aware role helper.
