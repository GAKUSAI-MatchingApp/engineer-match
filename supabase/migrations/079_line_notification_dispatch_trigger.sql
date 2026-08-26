-- Review #8 "LINE連携（通知）", part 3/3: wires public.notifications to the
-- LINE dispatch endpoint (src/app/api/line/dispatch/route.ts) via pg_net.
-- Held back from 077/078 on purpose until this point: pg_net is now enabled
-- on the remote project, and the two Vault secrets this function reads
-- (line_dispatch_url / line_dispatch_secret) are already registered --
-- confirmed by the user before this migration was written.
--
-- CREATE EXTENSION IF NOT EXISTS below is idempotent/defensive only (a
-- no-op against the already-enabled remote project); it exists so this
-- migration is reproducible standalone against a fresh environment (e.g. a
-- QA project reset) without a separate manual enable step there too.
--
-- Existing notification producers (private.notify_application_received /
-- notify_application_status_changed / notify_new_message / notify_new_review
-- / notify_new_review_reply / notify_opportunity_closed --
-- 036/050/059/061_*.sql) are completely untouched. This migration adds
-- exactly one more AFTER INSERT trigger on public.notifications, alongside
-- whatever no-producer / one-producer relationship already exists per row --
-- Postgres fires every AFTER INSERT trigger on a table for the same row, so
-- this does not replace or interfere with anything those producers already
-- do to create the row in the first place.
--
-- BR-83 (a notification's own delivery mechanics must never roll back the
-- business action that produced it -- see 059_notification_producers_phase2.sql's
-- header) is honored two ways at once here, not just one:
--   1. net.http_post() itself is asynchronous/fire-and-forget -- pg_net
--      queues the HTTP request for a background worker and returns
--      immediately, so this trigger's own transaction (i.e. the
--      notifications INSERT it fires on) never waits on, or can be aborted
--      by, whatever eventually happens to that HTTP call.
--   2. Everything this function does beyond the initial guard is wrapped in
--      its own BEGIN/EXCEPTION WHEN OTHERS block, exactly matching
--      notify_application_received() et al.'s established pattern --
--      RAISE LOG only, whatever the failure (vault lookup, pg_net itself
--      unavailable, a malformed secret, anything). No exception here is
--      ever allowed to propagate out and abort the notifications INSERT.
--
-- Trigger fires for EVERY notifications INSERT, then narrows to LINE-linked,
-- notification-enabled, currently-friended recipients with a single EXISTS
-- check against line_notification_links BEFORE touching Vault or pg_net at
-- all -- the overwhelmingly common case (a recipient with no LINE link) costs
-- one indexed lookup and nothing else, no network call.

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE OR REPLACE FUNCTION private.dispatch_line_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_dispatch_url TEXT;
    v_dispatch_secret TEXT;
BEGIN
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM public.line_notification_links
            WHERE user_id = NEW.user_id
              AND is_enabled = TRUE
              AND is_active = TRUE
        ) THEN
            SELECT decrypted_secret INTO v_dispatch_url
            FROM vault.decrypted_secrets
            WHERE name = 'line_dispatch_url';

            SELECT decrypted_secret INTO v_dispatch_secret
            FROM vault.decrypted_secrets
            WHERE name = 'line_dispatch_secret';

            IF v_dispatch_url IS NOT NULL AND v_dispatch_secret IS NOT NULL THEN
                -- Fire-and-forget: net.http_post queues the request and
                -- returns a bigint request id immediately (not awaited, not
                -- captured -- src/app/api/line/dispatch/route.ts's own
                -- line_dispatch_log is the delivery record of truth, not
                -- pg_net's internal response table).
                PERFORM net.http_post(
                    url := v_dispatch_url,
                    body := jsonb_build_object('notification_id', NEW.id),
                    headers := jsonb_build_object(
                        'Content-Type', 'application/json',
                        'Authorization', 'Bearer ' || v_dispatch_secret
                    )
                );
            ELSE
                RAISE LOG 'dispatch_line_notification: line_dispatch_url/line_dispatch_secret not found in Vault, skipping notification %', NEW.id;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'dispatch_line_notification failed for notification %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.dispatch_line_notification() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_dispatch_line_notification ON public.notifications;
CREATE TRIGGER trg_dispatch_line_notification
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION private.dispatch_line_notification();
