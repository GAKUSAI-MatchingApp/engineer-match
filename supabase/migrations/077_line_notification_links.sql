-- Review #8 "LINE連携（通知）": links an Engineer's own public.users account to
-- a LINE account for the sole purpose of also delivering existing in-app
-- notifications over LINE. This is NOT LINE Login-as-authentication --
-- Supabase Auth's own OAuth provider allowlist stays exactly google/github
-- (handle_new_user(), 072_harden_oauth_provider_allowlist.sql) and is
-- untouched here. LINE Login is used purely client-side-of-this-app to obtain
-- a verified line_user_id (see src/app/auth/line/callback/route.ts) for an
-- already-authenticated Supabase session; the row created here never grants
-- sign-in.
--
-- Design decisions carried over from the planning discussion on this branch:
--   * is_enabled: the user's own single V1 toggle ("LINE通知を受け取る"),
--     mutated only via set_line_notifications_enabled() below.
--   * is_active: NOT a user setting -- tracks whether this LINE account
--     currently follows the Messaging API official account (a prerequisite
--     for push delivery that is independent of LINE Login consent). Set once
--     synchronously at link time (checkLineBotFriendship() against
--     GET /v2/bot/profile/{userId}, since a user who already followed the OA
--     before ever linking would otherwise never produce a 'follow' webhook
--     event) and kept current afterwards by src/app/api/line/webhook/route.ts
--     on 'follow'/'unfollow' events, using the service-role client (RLS is
--     never involved on that path).
--   * line_user_id is UNIQUE and independent of any Supabase Auth identity,
--     specifically so a future "LINEでログイン" feature (explicitly out of
--     scope for review #8) can look it up directly to detect "this LINE
--     account is already linked to an existing Engineer Match account"
--     without a schema change.
--   * No row is ever hard-deleted (unlink_line_account() below sets
--     unlinked_at instead) -- consistent with this schema's general
--     preference for retaining history over physical deletes (applications,
--     chat, notifications' own soft patterns).
--
-- Existing notification producers (036/050/059/061) are completely untouched
-- by this migration. Actual LINE dispatch is wired up separately in 078/079
-- -- 079 in particular (not written yet) is deliberately held back until
-- pg_net is enabled on the remote project, per the explicit stop-point agreed
-- for this phase of the work.

CREATE TABLE IF NOT EXISTS public.line_notification_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    line_user_id TEXT NOT NULL,
    display_name TEXT,
    picture_url TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    unlinked_at TIMESTAMPTZ,
    last_followed_at TIMESTAMPTZ,
    last_unfollowed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One LINE link per Engineer Match account, and one Engineer Match account
-- per LINE account -- both directions of the mapping must be 1:1. The
-- (user_id) uniqueness also lets link_line_account() below use a plain
-- ON CONFLICT (user_id) upsert for re-linking after a previous unlink.
CREATE UNIQUE INDEX IF NOT EXISTS uq_line_notification_links_user
    ON public.line_notification_links (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_line_notification_links_line_user
    ON public.line_notification_links (line_user_id);

ALTER TABLE public.line_notification_links ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_line_notification_links_updated_at ON public.line_notification_links;
CREATE TRIGGER trg_line_notification_links_updated_at
    BEFORE UPDATE ON public.line_notification_links
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- RLS: read-only for the owner and for admins (support/troubleshooting
-- visibility). No INSERT/UPDATE/DELETE policy for anyone, including the
-- owner -- every write goes through one of the three SECURITY DEFINER RPCs
-- below (user-initiated) or the service-role client in
-- src/app/api/line/webhook/route.ts (follow/unfollow events), exactly
-- mirroring public.notifications' own no-client-write posture
-- (027_notification_favorite_policies.sql) and the current_user_is_active()
-- account-status gate hardened onto notifications/chat/messages in
-- 065_access_and_profile_integrity_hardening.sql.
DROP POLICY IF EXISTS line_notification_links_select_own ON public.line_notification_links;
CREATE POLICY line_notification_links_select_own
    ON public.line_notification_links
    FOR SELECT
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS line_notification_links_select_admin ON public.line_notification_links;
CREATE POLICY line_notification_links_select_admin
    ON public.line_notification_links
    FOR SELECT
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );

-- ============================================================
-- link_line_account: called once by src/app/auth/line/callback/route.ts,
-- under the just-authenticated Engineer's own Supabase session, after that
-- route has independently verified line_user_id via LINE's token endpoint +
-- profile endpoint (never trust a client-supplied line_user_id directly --
-- this function only ever receives it from that one server-side caller).
-- Upserts on (user_id) so re-linking (including after a prior unlink) never
-- produces a second row. Raises 23505 specifically when line_user_id already
-- belongs to a *different* user_id, so the callback route can show a
-- friendly "already linked to another account" message instead of a generic
-- failure.
-- ============================================================
CREATE OR REPLACE FUNCTION public.link_line_account(
    p_line_user_id TEXT,
    p_display_name TEXT,
    p_picture_url TEXT,
    p_is_active BOOLEAN
)
RETURNS public.line_notification_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_role TEXT;
    v_status TEXT;
    v_existing_owner UUID;
    v_row public.line_notification_links;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'link_line_account: no authenticated user'
            USING ERRCODE = '28000';
    END IF;

    SELECT role, status INTO v_role, v_status FROM public.users WHERE id = v_uid;

    IF v_role IS DISTINCT FROM 'ENGINEER' THEN
        RAISE EXCEPTION 'link_line_account: only ENGINEER accounts may link LINE notifications'
            USING ERRCODE = '42501';
    END IF;

    IF v_status IS DISTINCT FROM 'ACTIVE' THEN
        RAISE EXCEPTION 'link_line_account: account is not ACTIVE'
            USING ERRCODE = '42501';
    END IF;

    IF p_line_user_id IS NULL OR btrim(p_line_user_id) = '' THEN
        RAISE EXCEPTION 'link_line_account: line_user_id is required'
            USING ERRCODE = '22023';
    END IF;

    SELECT user_id INTO v_existing_owner
    FROM public.line_notification_links
    WHERE line_user_id = p_line_user_id;

    IF v_existing_owner IS NOT NULL AND v_existing_owner <> v_uid THEN
        RAISE EXCEPTION 'link_line_account: this LINE account is already linked to another user'
            USING ERRCODE = '23505';
    END IF;

    INSERT INTO public.line_notification_links AS l
        (user_id, line_user_id, display_name, picture_url, is_enabled, is_active, linked_at, unlinked_at)
    VALUES
        (v_uid, p_line_user_id, p_display_name, p_picture_url, TRUE, COALESCE(p_is_active, FALSE), now(), NULL)
    ON CONFLICT (user_id) DO UPDATE SET
        line_user_id = EXCLUDED.line_user_id,
        display_name = EXCLUDED.display_name,
        picture_url = EXCLUDED.picture_url,
        is_enabled = TRUE,
        is_active = EXCLUDED.is_active,
        linked_at = now(),
        unlinked_at = NULL
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.link_line_account(TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_line_account(TEXT, TEXT, TEXT, BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.link_line_account(TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;

-- ============================================================
-- set_line_notifications_enabled: the Settings page's single V1 ON/OFF
-- toggle. Only touches is_enabled -- never line_user_id/is_active/etc.
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_line_notifications_enabled(p_enabled BOOLEAN)
RETURNS public.line_notification_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.line_notification_links;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'set_line_notifications_enabled: no authenticated user'
            USING ERRCODE = '28000';
    END IF;

    UPDATE public.line_notification_links
    SET is_enabled = p_enabled
    WHERE user_id = v_uid
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'set_line_notifications_enabled: no LINE link for this account'
            USING ERRCODE = '42704';
    END IF;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.set_line_notifications_enabled(BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_line_notifications_enabled(BOOLEAN) FROM anon;
GRANT EXECUTE ON FUNCTION public.set_line_notifications_enabled(BOOLEAN) TO authenticated;

-- ============================================================
-- unlink_line_account: soft-unlink (row is kept for history/audit, matching
-- this schema's general no-physical-delete preference). Both is_enabled and
-- is_active are cleared so a stale row can never be mistaken for a live,
-- dispatch-eligible link. Re-linking afterward goes through
-- link_line_account()'s ON CONFLICT (user_id) upsert, which clears
-- unlinked_at again.
-- ============================================================
CREATE OR REPLACE FUNCTION public.unlink_line_account()
RETURNS public.line_notification_links
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_row public.line_notification_links;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'unlink_line_account: no authenticated user'
            USING ERRCODE = '28000';
    END IF;

    UPDATE public.line_notification_links
    SET is_enabled = FALSE,
        is_active = FALSE,
        unlinked_at = now()
    WHERE user_id = v_uid
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'unlink_line_account: no LINE link for this account'
            USING ERRCODE = '42704';
    END IF;

    RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.unlink_line_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.unlink_line_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.unlink_line_account() TO authenticated;
