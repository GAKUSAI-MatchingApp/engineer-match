-- Shared-Supabase compatibility: a friend's separate project uses the same
-- QA/dev Supabase project (org "gakusai.match@gmail.com's Org", project
-- "engineer-match-dev") and needs an 'INDIVIDUAL' public.users.role value.
-- Agreed with the friend as the minimal change required on this side.
--
-- Investigation (done against the live QA/shared database via the Supabase
-- Studio SQL Editor before writing this file):
--   1. public.users.role is a CHECK constraint (chk_users_role, VARCHAR(20)
--      column), not an ENUM type -- confirmed via pg_get_constraintdef.
--   2. The live chk_users_role constraint ALREADY contains 'INDIVIDUAL':
--        CHECK (((role)::text = ANY ((ARRAY['ENGINEER'::character varying,
--        'INSTRUCTOR'::character varying, 'COMPANY'::character varying,
--        'INDIVIDUAL'::character varying, 'ADMIN'::character varying])::text[])))
--      This was added out-of-band (not through a committed migration --
--      072_harden_oauth_provider_allowlist.sql already flagged this exact
--      drift in its own header comment as "out of scope for this
--      migration"). Section A below re-issues the DROP/CREATE with the
--      identical, already-live definition purely to bring migration history
--      back in sync with live schema (same reconciliation pattern 072 used
--      for handle_new_user()) -- it changes nothing functionally.
--   3. public.handle_new_user() and public.finalize_oauth_role(text) were
--      NOT yet patched on the live database -- both still reject
--      'INDIVIDUAL'. Sections B and C fix that.
--
-- Scope is intentionally minimal: only the single IN-list line in each
-- function is changed. All existing logic, comments, variable declarations,
-- and control flow are preserved verbatim (diffed against the live
-- pg_get_functiondef() output before writing this file). No RLS policy is
-- touched -- every existing policy allow-lists specific roles by equality
-- (e.g. current_user_role() = 'ADMIN' / 'INSTRUCTOR' / 'COMPANY'), so an
-- INDIVIDUAL-role user gets no special access anywhere; only
-- users_select_own / users_update_own (id = auth.uid(), role-independent)
-- apply, same as any other role. ENGINEER/INSTRUCTOR/COMPANY/ADMIN role
-- logic is completely unaffected:
--   - handle_new_user(): email/password signup still only accepts
--     ENGINEER/INSTRUCTOR/COMPANY; the OAuth-provider branch is untouched.
--   - finalize_oauth_role(): OAuth self-onboarding still only accepts
--     ENGINEER/COMPANY; INSTRUCTOR is deliberately NOT added here (per the
--     agreed scope with the friend).
--   - Triggers from 055 (admin status protection), 056 (application status
--     transitions), and 057 (opportunity publish company-name guard) key
--     off role = 'ADMIN' / application status / opportunity status and
--     company_profiles -- none reference the users.role allow-list this
--     migration touches, so none are affected.
--
-- Rollback (run manually if this migration needs to be reverted):
--
--   BEGIN;
--   ALTER TABLE public.users DROP CONSTRAINT chk_users_role;
--   ALTER TABLE public.users ADD CONSTRAINT chk_users_role
--       CHECK (role IN ('ENGINEER', 'INSTRUCTOR', 'COMPANY', 'ADMIN'));
--
--   CREATE OR REPLACE FUNCTION public.handle_new_user()
--   RETURNS TRIGGER
--   LANGUAGE plpgsql
--   SECURITY DEFINER
--   SET search_path = public
--   AS $$
--   DECLARE
--       v_role TEXT := NEW.raw_user_meta_data ->> 'role';
--       v_name TEXT := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'name'), '');
--       v_provider TEXT := NEW.raw_app_meta_data ->> 'provider';
--   BEGIN
--       IF v_role IS NULL THEN
--           IF v_provider IN ('google', 'github') THEN
--               RETURN NEW;
--           END IF;
--           RAISE EXCEPTION 'Invalid or missing role for public signup: %', v_role;
--       END IF;
--       IF v_role NOT IN ('ENGINEER', 'INSTRUCTOR', 'COMPANY') THEN
--           RAISE EXCEPTION 'Invalid or missing role for public signup: %', v_role;
--       END IF;
--       INSERT INTO public.users (id, role, name, email)
--       VALUES (NEW.id, v_role, COALESCE(v_name, split_part(NEW.email, '@', 1)), lower(NEW.email))
--       ON CONFLICT (id) DO NOTHING;
--       RETURN NEW;
--   END;
--   $$;
--
--   CREATE OR REPLACE FUNCTION public.finalize_oauth_role(p_role TEXT)
--   RETURNS public.users
--   LANGUAGE plpgsql
--   SECURITY DEFINER
--   SET search_path = public
--   AS $$
--   DECLARE
--       v_uid UUID := auth.uid();
--       v_email TEXT;
--       v_email_confirmed_at TIMESTAMPTZ;
--       v_meta JSONB;
--       v_name TEXT;
--       v_row public.users;
--   BEGIN
--       IF v_uid IS NULL THEN
--           RAISE EXCEPTION 'finalize_oauth_role: no authenticated user' USING ERRCODE = '28000';
--       END IF;
--       IF p_role NOT IN ('ENGINEER', 'COMPANY') THEN
--           RAISE EXCEPTION 'finalize_oauth_role: role % is not allowed via self-service onboarding', p_role
--               USING ERRCODE = '42501';
--       END IF;
--       IF EXISTS (SELECT 1 FROM public.users WHERE id = v_uid) THEN
--           RAISE EXCEPTION 'finalize_oauth_role: account already onboarded' USING ERRCODE = '42710';
--       END IF;
--       SELECT email, email_confirmed_at, raw_user_meta_data
--       INTO v_email, v_email_confirmed_at, v_meta
--       FROM auth.users WHERE id = v_uid;
--       IF v_email IS NULL OR v_email_confirmed_at IS NULL THEN
--           RAISE EXCEPTION 'finalize_oauth_role: no verified email for this account' USING ERRCODE = '42501';
--       END IF;
--       v_name := COALESCE(
--           NULLIF(TRIM(v_meta ->> 'full_name'), ''),
--           NULLIF(TRIM(v_meta ->> 'name'), ''),
--           NULLIF(TRIM(v_meta ->> 'user_name'), ''),
--           split_part(v_email, '@', 1)
--       );
--       INSERT INTO public.users (id, role, name, email)
--       VALUES (v_uid, p_role, v_name, lower(v_email))
--       RETURNING * INTO v_row;
--       RETURN v_row;
--   END;
--   $$;
--   COMMIT;
--
-- Note: role is a VARCHAR CHECK constraint here, not an ENUM type, so the
-- usual "ALTER TYPE ... ADD VALUE cannot run in the same transaction as
-- other changes" restriction does not apply to this migration.

-- ===========================================================================
-- Section A: reconcile chk_users_role with the value already live on the
-- shared QA database (DROP + CREATE with the identical definition).
-- ===========================================================================

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_users_role;

ALTER TABLE public.users ADD CONSTRAINT chk_users_role
    CHECK (role IN ('ENGINEER', 'INSTRUCTOR', 'COMPANY', 'INDIVIDUAL', 'ADMIN'));

-- ===========================================================================
-- Section B: handle_new_user() -- add 'INDIVIDUAL' to the email/password
-- signup allow-list. Only this IF line changes vs. the live/072 definition.
-- ===========================================================================

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

    IF v_role NOT IN ('ENGINEER', 'INSTRUCTOR', 'COMPANY', 'INDIVIDUAL') THEN
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

-- ===========================================================================
-- Section C: finalize_oauth_role() -- add 'INDIVIDUAL' to the OAuth
-- self-onboarding allow-list. INSTRUCTOR is deliberately NOT added (out of
-- scope for this change). Only this IF line changes vs. the live/071
-- definition.
-- ===========================================================================

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

    IF p_role NOT IN ('ENGINEER', 'COMPANY', 'INDIVIDUAL') THEN
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
