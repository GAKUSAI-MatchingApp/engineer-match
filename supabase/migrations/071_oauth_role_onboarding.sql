-- Google/GitHub OAuth sign-in currently fails outright for brand-new users:
-- handle_new_user() (002_users.sql, redefined in 029_remaining_policies.sql)
-- unconditionally RAISE EXCEPTIONs when raw_user_meta_data.role is missing,
-- and no OAuth provider ever supplies a `role` claim. That exception aborts
-- the whole auth.users INSERT transaction inside GoTrue, so the identity is
-- never created at all -- OAuth signup is currently impossible, not just
-- "missing a role".
--
-- This migration:
--   1. Lets handle_new_user() distinguish "role missing because this is a
--      malformed/bypassed email signup" (still rejected -- unchanged
--      behavior) from "role missing because this is a trusted OAuth
--      provider" (now allowed to create the auth.users row, but WITHOUT
--      inserting any public.users row -- no role is ever guessed here). The
--      signal used is NEW.raw_app_meta_data ->> 'provider': that column is
--      written by GoTrue itself from the actual signup method, never by
--      client-supplied signUp()/signInWithOAuth() options, so it cannot be
--      spoofed to skip the email/password path's existing role requirement.
--      Checked against an explicit allowlist ('google', 'github' -- the only
--      two providers this app wires up in LoginCard.tsx) rather than a
--      blocklist on 'email', so enabling some other provider (anonymous
--      sign-in, phone, a future OAuth provider) in the Supabase dashboard
--      does not silently start bypassing the role requirement here too.
--   2. Adds finalize_oauth_role(p_role), a SECURITY DEFINER RPC that an
--      authenticated OAuth user (auth.users row exists, public.users row
--      does not) calls exactly once, from the /auth/select-role onboarding
--      screen, to create their own public.users row as ENGINEER or COMPANY.
--      Never ADMIN/INSTRUCTOR, never for another auth.uid(), never a second
--      time -- it refuses once a public.users row already exists for that id.
--
-- Email/password signup (ALLOWED_SIGNUP_ROLES in RegisterCard.tsx, which
-- always sends options.data.role) is completely unaffected: v_role is always
-- present for that path, so it never reaches the new branch below.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT := NEW.raw_user_meta_data ->> 'role';
    v_name TEXT := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), '');
    v_provider TEXT := NEW.raw_app_meta_data ->> 'provider';
BEGIN
    IF v_role IS NULL THEN
        IF v_provider IN ('google', 'github') THEN
            -- Brand-new OAuth identity from a trusted, wired-up provider:
            -- allow auth.users to be created, but do not guess a business
            -- role. public.users is created later, exactly once, by
            -- finalize_oauth_role() after the user explicitly chooses
            -- ENGINEER or COMPANY.
            RETURN NEW;
        END IF;

        RAISE EXCEPTION 'Invalid or missing role for public signup: %', v_role;
    END IF;

    IF v_role NOT IN ('ENGINEER', 'INSTRUCTOR', 'COMPANY') THEN
        RAISE EXCEPTION 'Invalid or missing role for public signup: %', v_role;
    END IF;

    INSERT INTO public.users (id, role, name, email)
    VALUES (
        NEW.id,
        v_role,
        COALESCE(v_name, split_part(NEW.email, '@', 1)),
        lower(NEW.email)
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- on_auth_user_created (029_remaining_policies.sql) already points at
-- public.handle_new_user() by name -- CREATE OR REPLACE above is sufficient,
-- the trigger itself does not need to be dropped/recreated.

-- One-time ENGINEER/COMPANY self-onboarding for OAuth users whose
-- auth.users row exists but has no matching public.users row yet.
CREATE OR REPLACE FUNCTION public.finalize_oauth_role(p_role TEXT)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_email TEXT;
    v_email_confirmed_at TIMESTAMPTZ;
    v_meta JSONB;
    v_name TEXT;
    v_row public.users;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'finalize_oauth_role: no authenticated user'
            USING ERRCODE = '28000';
    END IF;

    IF p_role NOT IN ('ENGINEER', 'COMPANY') THEN
        RAISE EXCEPTION 'finalize_oauth_role: role % is not allowed via self-service onboarding', p_role
            USING ERRCODE = '42501';
    END IF;

    -- Locks out replay and role changes: once a public.users row exists for
    -- this id (from this function or from handle_new_user()), every future
    -- call refuses instead of updating it.
    IF EXISTS (SELECT 1 FROM public.users WHERE id = v_uid) THEN
        RAISE EXCEPTION 'finalize_oauth_role: account already onboarded'
            USING ERRCODE = '42710';
    END IF;

    SELECT email, email_confirmed_at, raw_user_meta_data
    INTO v_email, v_email_confirmed_at, v_meta
    FROM auth.users
    WHERE id = v_uid;

    IF v_email IS NULL OR v_email_confirmed_at IS NULL THEN
        -- OAuth providers have their email marked confirmed by GoTrue at
        -- identity-creation time; an unconfirmed email here means something
        -- upstream is wrong, so refuse rather than provisioning against an
        -- unverified address.
        RAISE EXCEPTION 'finalize_oauth_role: no verified email for this account'
            USING ERRCODE = '42501';
    END IF;

    v_name := COALESCE(
        NULLIF(TRIM(v_meta ->> 'full_name'), ''),
        NULLIF(TRIM(v_meta ->> 'name'), ''),
        NULLIF(TRIM(v_meta ->> 'user_name'), ''),
        split_part(v_email, '@', 1)
    );

    INSERT INTO public.users (id, role, name, email)
    VALUES (v_uid, p_role, v_name, lower(v_email))
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_oauth_role(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.finalize_oauth_role(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.finalize_oauth_role(TEXT) TO authenticated;
