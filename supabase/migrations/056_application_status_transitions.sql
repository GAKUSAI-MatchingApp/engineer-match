-- RD-2026-001 BR-53/BR-54 remediation: DB-level enforcement of the
-- applications.status transition graph. 025_application_policies.sql
-- (applications_update_poster) already documents this gap explicitly: "the
-- applied -> screening -> interview -> accepted/rejected transition graph
-- (and terminal-state irreversibility) is a sequencing rule, not a
-- row-ownership rule, and belongs in a BEFORE UPDATE trigger (not yet
-- built)". This migration builds that trigger.
--
-- Concretely, this closes two real gaps that RLS alone could not:
--   1. applications_update_withdraw's USING clause only requires
--      status <> 'withdrawn' -- it does not exclude 'accepted', so an
--      engineer could withdraw an application after the offer was already
--      accepted (WITHDRAWABLE_STATUSES in src/constants/applications.ts and
--      the withdrawApplication() pre-check are UI/app-layer only).
--   2. applications_update_poster has no transition graph at all -- a
--      company could move an application to any status from any status
--      (STATUS_NEXT_STEP / COMPANY_REJECTABLE_STATUSES in
--      src/lib/company/applicants.ts are UI/app-layer only).
--
-- The allowed graph mirrors src/lib/application-status.ts exactly:
--   applied    -> screening | rejected | withdrawn
--   screening  -> interview | rejected | withdrawn
--   interview  -> accepted  | rejected | withdrawn
--   accepted   -> completed                          (the only accepted exit)
--   rejected / withdrawn / completed -> (terminal, no further transitions)
--
-- No existing RLS policy, table, or row is modified -- this is a pure
-- additive trigger that sits underneath all three existing UPDATE policies
-- (applications_update_withdraw, applications_update_poster,
-- applications_admin_update) and rejects any transition none of the
-- application-layer code above should ever attempt in the first place.

CREATE OR REPLACE FUNCTION private.enforce_application_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NOT (
            (OLD.status = 'applied'   AND NEW.status IN ('screening', 'rejected', 'withdrawn')) OR
            (OLD.status = 'screening' AND NEW.status IN ('interview', 'rejected', 'withdrawn')) OR
            (OLD.status = 'interview' AND NEW.status IN ('accepted', 'rejected', 'withdrawn')) OR
            (OLD.status = 'accepted'  AND NEW.status = 'completed')
        ) THEN
            RAISE EXCEPTION 'invalid application status transition: % -> %', OLD.status, NEW.status
                USING ERRCODE = '22023';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_applications_status_transition ON public.applications;
CREATE TRIGGER trg_applications_status_transition
    BEFORE UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_application_status_transition();
