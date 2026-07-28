-- Phase 6.5 P0-4: complete last-active-admin invariant.
--
-- Purpose
--   Replace migration 055's ACTIVE ADMIN -> SUSPENDED-only guard with one
--   central invariant covering every row change that enters or leaves:
--
--       role = 'ADMIN' AND status = 'ACTIVE'
--
-- Protected departures
--   * ACTIVE ADMIN -> SUSPENDED or WITHDRAWN
--   * ACTIVE ADMIN role -> ENGINEER / COMPANY / INSTRUCTOR
--   * DELETE of an ACTIVE ADMIN public.users row
--   * Any equivalent simultaneous role/status change
--
-- Self protection
--   An ACTIVE Admin session cannot remove its own active-admin membership,
--   even when another active Admin exists. Another active Admin must perform
--   the operation.
--
-- Concurrency
--   A private singleton counter is updated atomically in the same transaction
--   as every Admin arrival/departure. Concurrent departures serialize on that
--   row; the second updater rechecks active_admin_count > 1 against the latest
--   committed value and cannot remove the final active Admin.
--
-- RLS/security impact
--   users_admin_update remains the application mutation path, and migration
--   067 makes it ACTIVE-only through current_user_role(). This SECURITY
--   DEFINER trigger is the non-bypassable invariant beneath RLS and privileged
--   or direct SQL paths. The function has an empty search_path and all
--   relations are schema-qualified. API roles receive no table/function grant.
--
-- Data impact
--   Creates one private invariant-state row initialized from the current active
--   Admin count. No public user row is changed.
--
-- Existing-data compatibility
--   Application aborts unless at least one ACTIVE ADMIN already exists.
--
-- Rollback
--   Restore private.enforce_admin_status_protection() and its UPDATE-only
--   trigger from migration 055, then drop private.admin_invariant_state.

CREATE TABLE private.admin_invariant_state (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    active_admin_count INTEGER NOT NULL CHECK (active_admin_count >= 1)
);

INSERT INTO private.admin_invariant_state (singleton, active_admin_count)
SELECT TRUE, count(*)::INTEGER
FROM public.users
WHERE role = 'ADMIN'
  AND status = 'ACTIVE'
HAVING count(*) >= 1;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM private.admin_invariant_state
        WHERE singleton = TRUE
    ) THEN
        RAISE EXCEPTION
            'admin invariant requires at least one active admin before migration'
            USING ERRCODE = '23514';
    END IF;
END;
$$;

REVOKE ALL ON TABLE private.admin_invariant_state FROM PUBLIC;
REVOKE ALL ON TABLE private.admin_invariant_state FROM anon;
REVOKE ALL ON TABLE private.admin_invariant_state FROM authenticated;

CREATE OR REPLACE FUNCTION private.enforce_admin_status_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_is_departure BOOLEAN;
    v_is_arrival BOOLEAN;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_is_departure := OLD.role = 'ADMIN' AND OLD.status = 'ACTIVE';
        v_is_arrival := FALSE;
    ELSIF TG_OP = 'INSERT' THEN
        v_is_departure := FALSE;
        v_is_arrival := NEW.role = 'ADMIN' AND NEW.status = 'ACTIVE';
    ELSE
        v_is_departure :=
            OLD.role = 'ADMIN'
            AND OLD.status = 'ACTIVE'
            AND (
                NEW.role IS DISTINCT FROM 'ADMIN'
                OR NEW.status IS DISTINCT FROM 'ACTIVE'
            );
        v_is_arrival :=
            NOT (OLD.role = 'ADMIN' AND OLD.status = 'ACTIVE')
            AND NEW.role = 'ADMIN'
            AND NEW.status = 'ACTIVE';
    END IF;

    IF v_is_arrival THEN
        UPDATE private.admin_invariant_state
        SET active_admin_count = active_admin_count + 1
        WHERE singleton = TRUE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'admin invariant state is missing'
                USING ERRCODE = '23514';
        END IF;
    ELSIF v_is_departure THEN
        IF OLD.id = auth.uid() THEN
            RAISE EXCEPTION
                'admins cannot remove their own active-admin membership'
                USING ERRCODE = '42501';
        END IF;

        UPDATE private.admin_invariant_state
        SET active_admin_count = active_admin_count - 1
        WHERE singleton = TRUE
          AND active_admin_count > 1;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'cannot remove the last active admin'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_admin_status_protection() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.enforce_admin_status_protection() FROM anon;
REVOKE EXECUTE ON FUNCTION private.enforce_admin_status_protection()
    FROM authenticated;

DROP TRIGGER IF EXISTS trg_users_admin_status_protection ON public.users;
CREATE TRIGGER trg_users_admin_status_protection
    BEFORE INSERT OR UPDATE OR DELETE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_admin_status_protection();

-- Verification SQL (run after application):
-- 1. Compare the ACTIVE ADMIN count in public.users with
--    private.admin_invariant_state.active_admin_count; both are equal and >= 1.
-- 2. Active Admin self-suspend, self-withdraw, self-demote, and self-delete
--    each fail with 42501.
-- 3. A second active Admin may suspend/withdraw/demote/delete another active
--    Admin only while at least one other active Admin remains.
-- 4. Two concurrent attempts to remove the final two active Admins serialize on
--    the counter row: one succeeds and the other fails with 42501.
-- 5. Promoting/creating an active Admin increments the counter; demotion,
--    suspension, withdrawal, or deletion decrements it in the same transaction.
-- 6. A failed user mutation rolls back its counter change in the same transaction.
