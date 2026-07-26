-- RD-2026-001 BR-103/BR-104 remediation: DB-level defense-in-depth for the
-- admin self-suspend / last-active-admin protections already enforced in
-- application code (src/lib/admin/users.ts updateUserStatus). RLS alone
-- (users_admin_update, 029_remaining_policies.sql) lets any ADMIN update any
-- users row, including their own -- there is no row-ownership exclusion and
-- no cross-row "how many other admins are left" check expressible in a
-- USING/WITH CHECK clause without re-triggering the same self-referencing
-- recursion problem users_protected_fields_unchanged already works around
-- (029, header comment). A BEFORE UPDATE trigger sees OLD/NEW directly and
-- can run an ordinary SELECT against public.users -- visible in full to the
-- ADMIN caller under users_select_admin RLS, so no SECURITY DEFINER
-- escalation is needed for the count itself.
--
-- Scope is intentionally narrow: only fires when an ADMIN row already
-- ACTIVE is being moved to SUSPENDED (mirrors updateUserStatus(), whose
-- nextStatus parameter only ever accepts "ACTIVE" | "SUSPENDED" -- WITHDRAWN
-- is not reachable through that function today). Reinstating
-- (SUSPENDED -> ACTIVE), WITHDRAWN transitions, and all non-ADMIN status
-- changes are completely unaffected. No existing RLS policy, table, or row
-- is modified -- this is a pure additive trigger.
--
-- Race condition: a plain "SELECT count(*) ... WHERE status = 'ACTIVE'" has
-- a TOCTOU gap under READ COMMITTED. If admins A and B are the only two
-- ACTIVE admins and two concurrent transactions suspend A and B at the same
-- moment, each transaction's count query (excluding its own target) would
-- see the OTHER one still ACTIVE (not yet committed) and both would pass,
-- leaving zero active admins once both commit. pg_advisory_xact_lock with a
-- fixed key serializes every "suspend an ADMIN" transaction through this
-- branch: the second transaction blocks until the first commits (releasing
-- the lock), then re-runs its count against the now-committed state and
-- correctly sees zero other active admins, so it is rejected. This is a
-- transaction-scoped lock (auto-released on commit/rollback) and only ever
-- taken on this specific ADMIN-role, ACTIVE-to-SUSPENDED path -- it has no
-- effect on any other write to public.users.

CREATE OR REPLACE FUNCTION private.enforce_admin_status_protection()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    other_active_admins INTEGER;
BEGIN
    IF OLD.role = 'ADMIN' AND OLD.status = 'ACTIVE' AND NEW.status = 'SUSPENDED' THEN
        IF OLD.id = auth.uid() THEN
            RAISE EXCEPTION 'admins cannot change their own account status'
                USING ERRCODE = '42501';
        END IF;

        -- Serializes concurrent admin-suspend transactions (see race
        -- condition note above) so the count below is never evaluated
        -- against another in-flight, not-yet-committed suspension.
        PERFORM pg_advisory_xact_lock(hashtext('admin_status_protection'));

        SELECT count(*) INTO other_active_admins
        FROM public.users
        WHERE role = 'ADMIN' AND status = 'ACTIVE' AND id <> OLD.id;

        IF other_active_admins = 0 THEN
            RAISE EXCEPTION 'cannot suspend the last active admin'
                USING ERRCODE = '42501';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_admin_status_protection ON public.users;
CREATE TRIGGER trg_users_admin_status_protection
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_admin_status_protection();
