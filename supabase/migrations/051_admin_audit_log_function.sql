-- Trusted write path for admin_audit_logs (018_admin_audit_logs.sql).
--
-- admin_audit_logs is intentionally append-only with SELECT-only RLS
-- (028_admin_policies.sql): a compromised or malicious admin session must
-- not be able to write, alter, or erase its own audit trail via a normal
-- authenticated UPDATE/INSERT grant. This migration adds the "trusted
-- SECURITY DEFINER function" path that comment anticipated -- it does NOT
-- add an INSERT policy to the table itself, so PostgREST/authenticated
-- clients still cannot write to admin_audit_logs directly. The function is
-- the only door in, and it re-verifies the caller is ADMIN on every call
-- (never trusts a role claim from the client).
--
-- No existing rows are affected. No UPDATE/DELETE path is added anywhere.

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
SET search_path = public
AS $$
DECLARE
    v_admin_id UUID := auth.uid();
    v_role TEXT;
    v_log_id UUID;
BEGIN
    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'admin_write_audit_log: no authenticated user';
    END IF;

    SELECT role INTO v_role FROM public.users WHERE id = v_admin_id;

    IF v_role IS DISTINCT FROM 'ADMIN' THEN
        RAISE EXCEPTION 'admin_write_audit_log: caller is not an ADMIN';
    END IF;

    IF p_action_type IS NULL OR length(trim(p_action_type)) = 0 THEN
        RAISE EXCEPTION 'admin_write_audit_log: action_type is required';
    END IF;

    IF p_target_type IS NULL OR length(trim(p_target_type)) = 0 THEN
        RAISE EXCEPTION 'admin_write_audit_log: target_type is required';
    END IF;

    INSERT INTO public.admin_audit_logs (
        admin_user_id, action_type, target_type, target_id, before_data, after_data, reason
    )
    VALUES (
        v_admin_id, p_action_type, p_target_type, p_target_id, p_before_data, p_after_data, p_reason
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- Default PUBLIC EXECUTE grant on new functions must be revoked explicitly;
-- only 'authenticated' (i.e. any logged-in Supabase user) may call it -- the
-- role check inside the function is what actually restricts this to admins.
REVOKE ALL ON FUNCTION public.admin_write_audit_log(TEXT, TEXT, UUID, JSONB, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_write_audit_log(TEXT, TEXT, UUID, JSONB, JSONB, TEXT) TO authenticated;
