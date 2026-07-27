-- Phase 6: active-account data access and profile/skill integrity.
--
-- Purpose
--   1. Make chat/message/notification RLS reject SUSPENDED and WITHDRAWN
--      sessions even when an old Supabase token remains valid.
--   2. Enforce Engineer skill cardinality (1..20 once the first skill exists)
--      without a count race.
--   3. Enforce the approved required Engineer profile fields on profile
--      creation and whenever one of those fields is changed.
--   4. Reject company established_year values later than the current JST year.
--
-- Data impact
--   No existing rows are rewritten or deleted. Existing incomplete Engineer
--   profiles remain readable and may change unrelated columns, but must supply
--   every required field when any required field is edited.
--
-- Security model
--   current_user_is_active() is SECURITY DEFINER only because RLS policies
--   need a non-recursive status lookup in public.users. It accepts no identity
--   input and derives the caller exclusively from auth.uid().
--
-- Rollback
--   Restore the policy bodies from 026/027/036, drop the three enforcement
--   triggers/functions below, then drop private.current_user_is_active().

CREATE OR REPLACE FUNCTION private.current_user_is_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND status = 'ACTIVE'
    );
$$;

REVOKE ALL ON FUNCTION private.current_user_is_active() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION private.current_user_is_active() FROM anon;
GRANT EXECUTE ON FUNCTION private.current_user_is_active() TO authenticated;

-- chat_rooms: active participants only.
DROP POLICY IF EXISTS chat_rooms_select_participant ON public.chat_rooms;
CREATE POLICY chat_rooms_select_participant
    ON public.chat_rooms
    FOR SELECT
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND (
            engineer_id = (SELECT auth.uid())
            OR company_user_id = (SELECT auth.uid())
        )
    );

DROP POLICY IF EXISTS chat_rooms_select_admin ON public.chat_rooms;
CREATE POLICY chat_rooms_select_admin
    ON public.chat_rooms
    FOR SELECT
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );

DROP POLICY IF EXISTS chat_rooms_insert_engineer ON public.chat_rooms;
CREATE POLICY chat_rooms_insert_engineer
    ON public.chat_rooms
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.id = chat_rooms.application_id
              AND a.applicant_id = (SELECT auth.uid())
              AND a.applicant_id = chat_rooms.engineer_id
              AND o.posted_by = chat_rooms.company_user_id
        )
    );

DROP POLICY IF EXISTS chat_rooms_insert_company ON public.chat_rooms;
CREATE POLICY chat_rooms_insert_company
    ON public.chat_rooms
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.applications a
            JOIN public.opportunities o ON o.id = a.opportunity_id
            WHERE a.id = chat_rooms.application_id
              AND o.posted_by = (SELECT auth.uid())
              AND o.posted_by = chat_rooms.company_user_id
              AND a.applicant_id = chat_rooms.engineer_id
        )
    );

DROP POLICY IF EXISTS chat_rooms_admin_insert ON public.chat_rooms;
CREATE POLICY chat_rooms_admin_insert
    ON public.chat_rooms
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );

DROP POLICY IF EXISTS chat_rooms_admin_update ON public.chat_rooms;
CREATE POLICY chat_rooms_admin_update
    ON public.chat_rooms
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );

-- messages: active participants only; immutable-content column grants remain
-- unchanged from 026_chat_policies.sql.
DROP POLICY IF EXISTS messages_select_participant ON public.messages;
CREATE POLICY messages_select_participant
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND EXISTS (
            SELECT 1
            FROM public.chat_rooms cr
            WHERE cr.id = messages.chat_room_id
              AND (
                  cr.engineer_id = (SELECT auth.uid())
                  OR cr.company_user_id = (SELECT auth.uid())
              )
        )
    );

DROP POLICY IF EXISTS messages_select_admin ON public.messages;
CREATE POLICY messages_select_admin
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );

DROP POLICY IF EXISTS messages_insert_participant ON public.messages;
CREATE POLICY messages_insert_participant
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND sender_id = (SELECT auth.uid())
        AND EXISTS (
            SELECT 1
            FROM public.chat_rooms cr
            WHERE cr.id = messages.chat_room_id
              AND (
                  cr.engineer_id = (SELECT auth.uid())
                  OR cr.company_user_id = (SELECT auth.uid())
              )
        )
    );

DROP POLICY IF EXISTS messages_admin_insert ON public.messages;
CREATE POLICY messages_admin_insert
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );

DROP POLICY IF EXISTS messages_update_read_receipt ON public.messages;
CREATE POLICY messages_update_read_receipt
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND sender_id <> (SELECT auth.uid())
        AND EXISTS (
            SELECT 1
            FROM public.chat_rooms cr
            WHERE cr.id = messages.chat_room_id
              AND (
                  cr.engineer_id = (SELECT auth.uid())
                  OR cr.company_user_id = (SELECT auth.uid())
              )
        )
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND sender_id <> (SELECT auth.uid())
        AND EXISTS (
            SELECT 1
            FROM public.chat_rooms cr
            WHERE cr.id = messages.chat_room_id
              AND (
                  cr.engineer_id = (SELECT auth.uid())
                  OR cr.company_user_id = (SELECT auth.uid())
              )
        )
    );

-- notifications: owners and admins must also be ACTIVE.
DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
CREATE POLICY notifications_select_own
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS notifications_select_admin ON public.notifications;
CREATE POLICY notifications_select_admin
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );

DROP POLICY IF EXISTS notifications_update_own ON public.notifications;
CREATE POLICY notifications_update_own
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS notifications_admin_update ON public.notifications;
CREATE POLICY notifications_admin_update
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    )
    WITH CHECK (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );

DROP POLICY IF EXISTS notifications_delete_own ON public.notifications;
CREATE POLICY notifications_delete_own
    ON public.notifications
    FOR DELETE
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND user_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS notifications_admin_delete ON public.notifications;
CREATE POLICY notifications_admin_delete
    ON public.notifications
    FOR DELETE
    TO authenticated
    USING (
        (SELECT private.current_user_is_active())
        AND (SELECT private.current_user_role()) = 'ADMIN'
    );

-- Engineer skill count: an account may start with zero before profile setup.
-- Once a first row exists, deleting the final row is rejected. Advisory locks
-- serialize concurrent inserts/deletes for the same Engineer.
CREATE OR REPLACE FUNCTION private.enforce_engineer_skill_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := COALESCE(NEW.user_id, OLD.user_id);
    v_count INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF NEW.user_id <> OLD.user_id THEN
            RAISE EXCEPTION 'user_skills.user_id is immutable'
                USING ERRCODE = '23514';
        END IF;
        RETURN NEW;
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended('engineer_skill_count:' || v_user_id::TEXT, 0)
    );

    SELECT count(*) INTO v_count
    FROM public.user_skills
    WHERE user_id = v_user_id;

    IF TG_OP = 'INSERT' AND v_count >= 20 THEN
        RAISE EXCEPTION 'engineer skill count cannot exceed 20'
            USING ERRCODE = '23514';
    END IF;

    IF TG_OP = 'DELETE' THEN
        -- Permit FK cascade if the parent account is actually being removed.
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_user_id) THEN
            RETURN OLD;
        END IF;
        IF v_count <= 1 THEN
            RAISE EXCEPTION 'engineer skill count cannot be less than 1'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_skills_count_guard ON public.user_skills;
CREATE TRIGGER trg_user_skills_count_guard
    BEFORE INSERT OR DELETE OR UPDATE OF user_id ON public.user_skills
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_engineer_skill_count();

-- Required Engineer profile fields. UPDATE OF keeps unrelated changes (for
-- example is_public) compatible with historical incomplete rows.
CREATE OR REPLACE FUNCTION private.enforce_engineer_profile_required_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.prefecture IS NULL OR pg_catalog.btrim(NEW.prefecture) = ''
       OR NEW.years_of_experience IS NULL
       OR NEW.work_style IS NULL
       OR NEW.desired_rate_min IS NULL
       OR NEW.desired_rate_max IS NULL THEN
        RAISE EXCEPTION 'engineer profile required fields are missing'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_engineer_profiles_required_fields ON public.engineer_profiles;
CREATE TRIGGER trg_engineer_profiles_required_fields
    BEFORE INSERT OR UPDATE OF
        prefecture,
        years_of_experience,
        work_style,
        desired_rate_min,
        desired_rate_max
    ON public.engineer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_engineer_profile_required_fields();

-- Time-dependent validation belongs in a trigger rather than an immutable
-- CHECK constraint. Asia/Tokyo matches the application specification.
CREATE OR REPLACE FUNCTION private.enforce_company_established_year()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_current_year INTEGER :=
        pg_catalog.date_part(
            'year',
            pg_catalog.timezone('Asia/Tokyo', pg_catalog.clock_timestamp())
        )::INTEGER;
BEGIN
    IF NEW.established_year IS NOT NULL AND NEW.established_year > v_current_year THEN
        RAISE EXCEPTION 'established_year cannot be later than the current year'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_company_profiles_established_year ON public.company_profiles;
CREATE TRIGGER trg_company_profiles_established_year
    BEFORE INSERT OR UPDATE OF established_year ON public.company_profiles
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_company_established_year();
