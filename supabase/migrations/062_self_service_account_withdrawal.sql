-- RD-2026-001 4.11 (C-11) / BR-115~BR-118: self-service account withdrawal.
--
-- users_update_own (029_remaining_policies.sql) deliberately locks role/
-- status/deleted_at from any client-side UPDATE via
-- private.users_protected_fields_unchanged -- there is no RLS path today
-- (and this migration adds none) that lets an ENGINEER/COMPANY client move
-- their own status to WITHDRAWN directly. This migration adds the one
-- narrow door in: a SECURITY DEFINER RPC that performs exactly the
-- ACTIVE -> WITHDRAWN transition for the calling user, re-validating every
-- precondition server-side so it is safe to call directly (not just from
-- the UI that happens to call it first).
--
-- Preconditions enforced here, all against the row locked FOR UPDATE under
-- auth.uid() (never a client-supplied id -- there is no id parameter):
--   * caller is authenticated (auth.uid() IS NOT NULL)
--   * caller's public.users row exists
--   * role IN ('ENGINEER', 'COMPANY') -- ADMIN and INSTRUCTOR are rejected,
--     so this can never become a self-service path for admin withdrawal
--     (out of scope per Phase 3) or reach a role with no dashboard at all
--   * status = 'ACTIVE' -- rejects SUSPENDED (must be reinstated by an
--     admin first) and already-WITHDRAWN (no-op/replay), so this can never
--     be used to "re-confirm" a withdrawal or as a WITHDRAWN -> ACTIVE path
--   * COMPANY only: zero rows in public.opportunities with
--     posted_by = auth.uid() AND status = 'published' -- re-checked here
--     even though the UI performs the same check first, so calling this
--     RPC directly (bypassing the UI) cannot skip the guard
--
-- On success: UPDATE public.users SET status = 'WITHDRAWN', deleted_at =
-- now() WHERE id = auth.uid(). chk_users_withdrawal_consistency
-- (002_users.sql) already requires deleted_at IS NOT NULL exactly when
-- status = 'WITHDRAWN', so both columns are set together in the one
-- UPDATE. trg_users_admin_status_protection (055) only fires for
-- OLD.role = 'ADMIN', so it is a guaranteed no-op on this path. No other
-- table is touched -- applications, opportunities, chat_rooms, messages,
-- favorites, engineer_reviews, notifications, and every profile table are
-- completely untouched by this function, preserving all of it as history.
--
-- No withdrawal reason is accepted or stored here by design: Phase 3's
-- instructions are explicit that persisting a withdrawal reason belongs to
-- a future account_audit_logs phase, and no new column/table should be
-- added speculatively ahead of that. The reason text collected in the UI
-- never leaves the browser.
--
-- SECURITY DEFINER + fixed search_path='public' (matching the established
-- public.admin_write_audit_log pattern, 051_admin_audit_log_function.sql)
-- so this function's writes bypass RLS the same way handle_new_user()
-- (002_users.sql) and admin_write_audit_log() already do for their own
-- narrow, re-validated paths -- not a blanket bypass, since every
-- precondition above is re-checked inside the function body regardless of
-- what RLS would otherwise allow. EXECUTE is revoked from PUBLIC and anon
-- and granted only to authenticated, matching the corrected grant shape
-- from 053_admin_audit_log_function_grant_fix.sql (a bare "REVOKE ALL ...
-- FROM PUBLIC" does not touch anon's own default grant).

CREATE OR REPLACE FUNCTION public.withdraw_own_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_role TEXT;
    v_status TEXT;
    v_published_count INTEGER;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'withdraw_own_account: no authenticated user'
            USING ERRCODE = '28000';
    END IF;

    SELECT role, status INTO v_role, v_status
    FROM public.users
    WHERE id = v_uid
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'withdraw_own_account: account not found'
            USING ERRCODE = '28000';
    END IF;

    IF v_role NOT IN ('ENGINEER', 'COMPANY') THEN
        RAISE EXCEPTION 'withdraw_own_account: role % is not eligible for self-service withdrawal', v_role
            USING ERRCODE = '42501';
    END IF;

    IF v_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'withdraw_own_account: account is not ACTIVE'
            USING ERRCODE = '42501';
    END IF;

    IF v_role = 'COMPANY' THEN
        SELECT count(*) INTO v_published_count
        FROM public.opportunities
        WHERE posted_by = v_uid AND status = 'published';

        IF v_published_count > 0 THEN
            RAISE EXCEPTION 'withdraw_own_account: company has % published opportunity(ies)', v_published_count
                USING ERRCODE = '23514';
        END IF;
    END IF;

    UPDATE public.users
    SET status = 'WITHDRAWN', deleted_at = now()
    WHERE id = v_uid;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_own_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.withdraw_own_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.withdraw_own_account() TO authenticated;
