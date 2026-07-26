-- RD-2026-001 C-09 Phase 2: producers for the three notification types that
-- have had no producer since 013_notifications.sql first defined them --
-- application_received, application_status_changed, opportunity_closed.
-- chk_notifications_type (013, rebuilt whole by 050_engineer_reviews.sql)
-- already lists all three; no CHECK constraint change is needed here. The
-- real live unique index is the composite uq_notifications_user_event_key
-- (user_id, event_key) (ground-truth per 038's documented drift lesson), so
-- every ON CONFLICT below targets (user_id, event_key), exactly like
-- notify_new_message / notify_new_review / notify_new_review_reply
-- (036/038/050). No RLS policy changes: notifications_select_own /
-- notifications_update_own (027) already cover any row regardless of type,
-- and there is still no client-facing INSERT policy on notifications --
-- these three producers are SECURITY DEFINER triggers, the only way rows
-- of any type ever get inserted.
--
-- BR-83 (notification failure must never roll back the business action it
-- describes): each producer wraps its own INSERT(s) in a nested
-- BEGIN/EXCEPTION WHEN OTHERS block that only RAISE LOGs and swallows the
-- error, so applications INSERT/UPDATE and opportunities UPDATE always
-- succeed regardless of what happens on the notifications side. This is a
-- new pattern relative to the three pre-existing producers (which have no
-- such guard) -- not applied to them here, since 036/050 are historical
-- migrations that must not be edited and their current behavior is
-- explicitly out of scope to change this phase.

-- ============================================================
-- application_received: notify the opportunity's own COMPANY user
-- (opportunities.posted_by, resolved server-side via a join -- never a
-- client-supplied user_id) when an application is successfully inserted.
-- ============================================================
CREATE OR REPLACE FUNCTION private.notify_application_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_recipient UUID;
    v_opportunity_title TEXT;
    v_applicant_name TEXT;
BEGIN
    BEGIN
        SELECT o.posted_by, o.title INTO v_recipient, v_opportunity_title
        FROM public.opportunities o
        WHERE o.id = NEW.opportunity_id;

        SELECT u.name INTO v_applicant_name
        FROM public.users u
        WHERE u.id = NEW.applicant_id;

        IF v_recipient IS NOT NULL THEN
            INSERT INTO public.notifications
                (user_id, type, title, body, related_entity_type, related_entity_id, event_key)
            VALUES (
                v_recipient,
                'application_received',
                '新しい応募がありました',
                left(
                    COALESCE(v_applicant_name, '応募者') || 'さんが「' ||
                    COALESCE(v_opportunity_title, '求人・案件') || '」に応募しました。',
                    255
                ),
                'application',
                NEW.id,
                'application_received:' || NEW.id
            )
            ON CONFLICT (user_id, event_key) DO NOTHING;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'notify_application_received failed for application %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.notify_application_received() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_application_received ON public.applications;
CREATE TRIGGER trg_notify_application_received
    AFTER INSERT ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION private.notify_application_received();

-- ============================================================
-- application_status_changed: notify the applicant (Engineer) whenever
-- status actually changes value. Only fires on rows that were actually
-- written -- trg_applications_status_transition (056, a BEFORE UPDATE
-- trigger, runs first per Postgres trigger ordering) already aborts the
-- whole UPDATE for any forbidden transition, so a rejected transition never
-- reaches this AFTER trigger at all; nothing extra is needed here to honor
-- that rule. event_key includes NEW.status (not just NEW.id) so that
-- applied->screening->interview->accepted->completed each produce their own
-- distinct notification instead of colliding on the same (user_id,
-- event_key) pair.
-- ============================================================
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
    IF NEW.status IS DISTINCT FROM OLD.status THEN
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

REVOKE ALL ON FUNCTION private.notify_application_status_changed() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_application_status_changed ON public.applications;
CREATE TRIGGER trg_notify_application_status_changed
    AFTER UPDATE ON public.applications
    FOR EACH ROW
    EXECUTE FUNCTION private.notify_application_status_changed();

-- ============================================================
-- opportunity_closed: notify every non-withdrawn/non-rejected applicant
-- when the opportunity's own COMPANY closes it. Scoped to COMPANY-acting
-- sessions only (private.current_user_role(), evaluated against auth.uid()
-- of the actual caller regardless of this function's own SECURITY DEFINER
-- escalation) -- this is what excludes Admin's force-close
-- (updateOpportunityModeration action='close', which also sets
-- status='closed' via opportunities_admin_update RLS) and Admin takedown
-- (which never changes status at all, only unpublished_by_admin -- already
-- excluded by the NEW.status = 'closed' check alone). Admin-driven
-- opportunity-closed notifications are an explicitly separate, future
-- requirement, not built here. Each recipient's INSERT is wrapped
-- individually so one recipient's failure can't affect any other
-- recipient's notification in the same closure event.
-- ============================================================
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
                    'opportunity_closed:' || NEW.id
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

REVOKE ALL ON FUNCTION private.notify_opportunity_closed() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_notify_opportunity_closed ON public.opportunities;
CREATE TRIGGER trg_notify_opportunity_closed
    AFTER UPDATE ON public.opportunities
    FOR EACH ROW
    EXECUTE FUNCTION private.notify_opportunity_closed();
