-- Migration history must stay reproducible: 071_oauth_role_onboarding.sql was
-- already applied against the live database before its handle_new_user()
-- was hardened from a provider blocklist (v_provider <> 'email') to an
-- explicit allowlist (v_provider IN ('google', 'github')) -- see that file's
-- own header comment for the full rationale. Editing 071 in place after it
-- was applied would desync migration history from what actually ran, so
-- this migration instead re-applies the corrected function definition on
-- its own, as the next step in history.
--
-- This is the exact handle_new_user() body from the current local
-- 071_oauth_role_onboarding.sql -- nothing else. No other function,
-- trigger, grant, RLS policy, or table/constraint is touched here. In
-- particular, this does not address the unrelated 'INDIVIDUAL' value
-- present in the live chk_users_role constraint -- that is out of scope for
-- this migration.

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
