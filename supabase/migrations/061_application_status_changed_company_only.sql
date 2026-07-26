-- Bug fix for 059_notification_producers_phase2.sql's
-- private.notify_application_status_changed(), found during live E2E
-- testing: the Phase 2 spec is explicit that this notification's trigger is
-- "Companyによるapplication status updateがDB上で正常に成立した場合"
-- (a status update performed BY THE COMPANY) -- but the original function
-- fired on ANY status change regardless of who performed it, including the
-- Engineer's own self-service withdrawal (applications_update_withdraw
-- RLS, 025_application_policies.sql). Live-confirmed: withdrawing an
-- application as the Engineer notified that same Engineer that "your
-- status changed to withdrawn" -- a redundant, spec-violating notification
-- about the user's own just-completed action.
--
-- Fix: gate the notification on the acting session's role, exactly like
-- notify_opportunity_closed (059) already does for the same class of
-- problem -- private.current_user_role() reflects auth.uid() of the actual
-- caller regardless of this function's own SECURITY DEFINER escalation, so
-- an Engineer's self-withdraw (role='ENGINEER') and any future Admin-side
-- application mutation (role='ADMIN', no such UI exists today per the
-- Admin console being read-only for applications, but excluded here for
-- correctness regardless) no longer produce this notification -- only a
-- COMPANY-performed status change does, exactly per spec.
--
-- No RLS policy, table, or row is modified. No existing data changed --
-- this only replaces the trigger function body (CREATE OR REPLACE); the
-- trigger itself (trg_notify_application_status_changed, 059) is untouched.

CREATE OR REPLACE FUNCTION private.notify_application_status_changed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_opportunity_title TEXT;
    v_status_label TEXT;
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status
       AND (SELECT private.current_user_role()) = 'COMPANY'
    THEN
        BEGIN
            SELECT o.title INTO v_opportunity_title
            FROM public.opportunities o
            WHERE o.id = NEW.opportunity_id;

            v_status_label := CASE NEW.status
                WHEN 'applied' THEN '応募済み'
                WHEN 'screening' THEN '書類選考中'
                WHEN 'interview' THEN '面接'
                WHEN 'accepted' THEN '内定'
                WHEN 'rejected' THEN '不採用'
                WHEN 'withdrawn' THEN '辞退'
                WHEN 'completed' THEN '完了'
                ELSE NEW.status
            END;

            INSERT INTO public.notifications
                (user_id, type, title, body, related_entity_type, related_entity_id, event_key)
            VALUES (
                NEW.applicant_id,
                'application_status_changed',
                '選考ステータスが更新されました',
                left(
                    '「' || COALESCE(v_opportunity_title, '求人・案件') || '」の選考ステータスが「' ||
                    v_status_label || '」に変更されました。',
                    255
                ),
                'application',
                NEW.id,
                'application_status_changed:' || NEW.id || ':' || NEW.status
            )
            ON CONFLICT (user_id, event_key) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'notify_application_status_changed failed for application %: %', NEW.id, SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$;
