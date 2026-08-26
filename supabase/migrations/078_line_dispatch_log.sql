-- Review #8 "LINE連携（通知）", part 2/3: a delivery ledger for LINE push
-- attempts, kept fully independent of public.notifications and of pg_net.
--
-- This migration intentionally does NOT touch public.notifications, does NOT
-- create the dispatch trigger, and does NOT enable the pg_net extension --
-- pg_net is confirmed disabled on the remote project as of this phase, and
-- enabling it plus wiring the actual dispatch trigger is deliberately held
-- for a separate migration (079, not written yet) applied only after pg_net
-- is turned on and the Vault secrets it needs are registered. This migration
-- is safe to write and apply on its own with no external dependency.
--
-- Why a separate log table instead of columns on public.notifications:
-- keeps 013_notifications.sql's schema (and every existing producer's
-- INSERT list, 036/050/059/061) completely untouched, and keeps the
-- notifications table's own RLS/read model unaffected by anything LINE-
-- related. src/app/api/line/dispatch/route.ts (the HTTP endpoint 079's
-- trigger will eventually call via pg_net) is the only writer, using the
-- service-role client -- no RLS write path is needed here at all.
--
-- notification_id UNIQUE is the idempotency guard: the dispatch route claims
-- a notification by inserting this row first (status='queued') and treats a
-- 23505 unique-violation on that insert as "already handled, skip" -- this is
-- what makes a pg_net retry, or two overlapping dispatch calls for the same
-- notification, safe against a duplicate LINE push.

CREATE TABLE IF NOT EXISTS public.line_dispatch_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES public.notifications (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued',
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_line_dispatch_log_status CHECK (status IN ('queued', 'sent', 'failed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_line_dispatch_log_notification
    ON public.line_dispatch_log (notification_id);
CREATE INDEX IF NOT EXISTS idx_line_dispatch_log_user_created
    ON public.line_dispatch_log (user_id, created_at);

ALTER TABLE public.line_dispatch_log ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_line_dispatch_log_updated_at ON public.line_dispatch_log;
CREATE TRIGGER trg_line_dispatch_log_updated_at
    BEFORE UPDATE ON public.line_dispatch_log
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- No client access at all, not even the owning user -- this is purely an
-- internal delivery ledger written by the service-role client in
-- src/app/api/line/dispatch/route.ts. Admin SELECT only, for future
-- support/troubleshooting visibility, matching notifications_select_admin's
-- precedent (027_notification_favorite_policies.sql /
-- 065_access_and_profile_integrity_hardening.sql).
DROP POLICY IF EXISTS line_dispatch_log_select_admin ON public.line_dispatch_log;
CREATE POLICY line_dispatch_log_select_admin
    ON public.line_dispatch_log
    FOR SELECT
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );
