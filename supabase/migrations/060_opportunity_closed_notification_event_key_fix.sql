-- Bug fix for 059_notification_producers_phase2.sql's
-- private.notify_opportunity_closed(), found during pre-E2E live
-- verification of that migration.
--
-- Ground truth from the live database (SELECT indexname, indexdef FROM
-- pg_indexes WHERE tablename = 'notifications'): there are TWO unique
-- indexes on notifications, not one --
--   uq_notifications_user_event_key UNIQUE (user_id, event_key)
--   uq_notifications_event_key      UNIQUE (event_key)
-- (037_fix_notifications_event_key_unique_index.sql's single-column index
-- apparently did get created against this database at some point, despite
-- 038's contemporaneous finding that it did not exist -- both indexes are
-- live now regardless of that history).
--
-- 059's notify_opportunity_closed() generated the SAME event_key string
-- ('opportunity_closed:' || NEW.id) for every recipient of one closure
-- event, differing only by user_id. That satisfies the composite
-- (user_id, event_key) index, but the second and every subsequent
-- recipient's INSERT collides with the FIRST recipient's row on the
-- single-column event_key-only index. `ON CONFLICT (user_id, event_key)`
-- only catches conflicts on that specific named arbiter -- a conflict
-- raised by the *other* unique index is a real, uncaught 23505 error at the
-- INSERT statement level, which then falls into this producer's own
-- per-recipient `EXCEPTION WHEN OTHERS` handler and gets silently logged
-- and swallowed (correctly, per BR-83 -- the opportunities UPDATE itself
-- was never at risk). Net effect: only the first applicant notified per
-- opportunity_closed event; every other applicant silently got nothing.
--
-- Fix: make event_key itself globally unique per recipient by including the
-- recipient's own id, not just the opportunity's -- ':' || r.applicant_id
-- appended. This satisfies both unique indexes simultaneously and is a
-- strictly more specific key than before (still trivially reproducible /
-- idempotent for the same opportunity+recipient pair, which is exactly the
-- duplicate this dedup is meant to catch).
--
-- No RLS policy, table, or row is modified. No existing data changed --
-- this only replaces the trigger function body (CREATE OR REPLACE); the
-- trigger itself is untouched (059 already created it correctly).

CREATE OR REPLACE FUNCTION private.notify_opportunity_closed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_body TEXT;
    r RECORD;
BEGIN
    IF NEW.status = 'closed'
       AND OLD.status IS DISTINCT FROM 'closed'
       AND (SELECT private.current_user_role()) = 'COMPANY'
    THEN
        v_body := left('「' || NEW.title || '」の募集が終了しました。', 255);

        FOR r IN
            SELECT a.applicant_id
            FROM public.applications a
            WHERE a.opportunity_id = NEW.id
              AND a.status NOT IN ('withdrawn', 'rejected')
        LOOP
            BEGIN
                INSERT INTO public.notifications
                    (user_id, type, title, body, related_entity_type, related_entity_id, event_key)
                VALUES (
                    r.applicant_id,
                    'opportunity_closed',
                    '求人・案件の募集が終了しました',
                    v_body,
                    'opportunity',
                    NEW.id,
                    'opportunity_closed:' || NEW.id || ':' || r.applicant_id
                )
                ON CONFLICT (user_id, event_key) DO NOTHING;
            EXCEPTION WHEN OTHERS THEN
                RAISE LOG 'notify_opportunity_closed failed for opportunity % recipient %: %',
                    NEW.id, r.applicant_id, SQLERRM;
            END;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;
