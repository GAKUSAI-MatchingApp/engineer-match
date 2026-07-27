-- Phase 6: atomic Company opportunity create/update and DB integrity.
--
-- Purpose
--   Replace the browser's independent parent/subtype/skill writes with one
--   transaction-scoped RPC and enforce the Phase 4 opportunity invariants at
--   the database boundary.
--
-- Affected tables
--   opportunities, opportunity_employment, opportunity_project,
--   opportunity_hourly, opportunity_required_skills.
--   opportunity_training remains untouched because it is outside the current
--   Company job-posting flow.
--
-- Data impact
--   No existing rows are rewritten or deleted by this migration. The new
--   NOT VALID checks protect every future insert/update without rejecting the
--   migration solely because of a historical row. Verification SQL should
--   confirm whether those constraints can subsequently be VALIDATEd.
--
-- Security model
--   save_company_opportunity() is SECURITY DEFINER because it must mutate five
--   RLS-protected tables atomically. It derives the owner only from auth.uid(),
--   requires an ACTIVE COMPANY account, locks owned rows during update, uses a
--   fixed empty search_path, contains no dynamic SQL, and accepts no owner id.
--   PUBLIC and anon cannot execute it.
--
-- Rollback
--   Drop save_company_opportunity(), the integrity/deadline triggers and their
--   private functions, then drop the two Phase 6 CHECK constraints. Reverting
--   application code to the pre-Phase-6 multi-call flow is also required.

ALTER TABLE public.opportunities
    DROP CONSTRAINT IF EXISTS chk_opportunities_description_length;
ALTER TABLE public.opportunities
    ADD CONSTRAINT chk_opportunities_description_length
    CHECK (pg_catalog.char_length(description) <= 3000)
    NOT VALID;

-- Nullable legacy rows from before migration 063 remain valid historical data,
-- while every new/updated hourly row must now carry the approved work style.
ALTER TABLE public.opportunity_hourly
    DROP CONSTRAINT IF EXISTS chk_opportunity_hourly_work_style_required;
ALTER TABLE public.opportunity_hourly
    ADD CONSTRAINT chk_opportunity_hourly_work_style_required
    CHECK (work_style IS NOT NULL)
    NOT VALID;

CREATE OR REPLACE FUNCTION private.enforce_current_project_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_today DATE :=
        pg_catalog.timezone('Asia/Tokyo', pg_catalog.clock_timestamp())::DATE;
BEGIN
    IF NEW.deadline < v_today THEN
        RAISE EXCEPTION 'project deadline cannot be earlier than today'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunity_project_current_deadline ON public.opportunity_project;
CREATE TRIGGER trg_opportunity_project_current_deadline
    BEFORE INSERT OR UPDATE ON public.opportunity_project
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_current_project_deadline();

/**
 * Deferred because an atomic save necessarily creates/updates the parent,
 * subtype and skill rows in separate SQL statements inside one transaction.
 * The invariant is checked only against the final transaction state.
 */
CREATE OR REPLACE FUNCTION private.enforce_company_opportunity_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_opportunity_id UUID;
    v_side TEXT;
    v_contract_type TEXT;
    v_skill_count INTEGER;
    v_subtype_count INTEGER;
BEGIN
    IF TG_TABLE_NAME = 'opportunities' THEN
        v_opportunity_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END;
    ELSE
        v_opportunity_id :=
            CASE WHEN TG_OP = 'DELETE' THEN OLD.opportunity_id ELSE NEW.opportunity_id END;
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended('company_opportunity:' || v_opportunity_id::TEXT, 0)
    );

    SELECT side, contract_type
    INTO v_side, v_contract_type
    FROM public.opportunities
    WHERE id = v_opportunity_id;

    -- Parent deletion (and its cascades) is valid.
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    -- Training-side data has its own future-phase lifecycle.
    IF v_side <> 'ENGINEER'
       OR v_contract_type NOT IN ('employment', 'project', 'hourly') THEN
        RETURN NULL;
    END IF;

    SELECT count(*) INTO v_skill_count
    FROM public.opportunity_required_skills
    WHERE opportunity_id = v_opportunity_id;

    IF v_skill_count < 1 OR v_skill_count > 10 THEN
        RAISE EXCEPTION 'opportunity required skill count must be between 1 and 10'
            USING ERRCODE = '23514';
    END IF;

    SELECT
        (EXISTS (
            SELECT 1 FROM public.opportunity_employment
            WHERE opportunity_id = v_opportunity_id
        ))::INTEGER
        + (EXISTS (
            SELECT 1 FROM public.opportunity_project
            WHERE opportunity_id = v_opportunity_id
        ))::INTEGER
        + (EXISTS (
            SELECT 1 FROM public.opportunity_hourly
            WHERE opportunity_id = v_opportunity_id
        ))::INTEGER
    INTO v_subtype_count;

    IF v_subtype_count <> 1
       OR (v_contract_type = 'employment' AND NOT EXISTS (
           SELECT 1 FROM public.opportunity_employment
           WHERE opportunity_id = v_opportunity_id
       ))
       OR (v_contract_type = 'project' AND NOT EXISTS (
           SELECT 1 FROM public.opportunity_project
           WHERE opportunity_id = v_opportunity_id
       ))
       OR (v_contract_type = 'hourly' AND NOT EXISTS (
           SELECT 1 FROM public.opportunity_hourly
           WHERE opportunity_id = v_opportunity_id
       )) THEN
        RAISE EXCEPTION 'opportunity must have exactly one matching subtype row'
            USING ERRCODE = '23514';
    END IF;

    RETURN NULL;
END;
$$;

-- Moving a relation row between parents could otherwise leave the old parent
-- incomplete while only the new id is visible to an UPDATE trigger event.
CREATE OR REPLACE FUNCTION private.prevent_opportunity_relation_move()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.opportunity_id IS DISTINCT FROM OLD.opportunity_id THEN
        RAISE EXCEPTION 'opportunity_id is immutable'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunity_employment_parent_immutable
    ON public.opportunity_employment;
CREATE TRIGGER trg_opportunity_employment_parent_immutable
    BEFORE UPDATE OF opportunity_id ON public.opportunity_employment
    FOR EACH ROW
    EXECUTE FUNCTION private.prevent_opportunity_relation_move();

DROP TRIGGER IF EXISTS trg_opportunity_project_parent_immutable
    ON public.opportunity_project;
CREATE TRIGGER trg_opportunity_project_parent_immutable
    BEFORE UPDATE OF opportunity_id ON public.opportunity_project
    FOR EACH ROW
    EXECUTE FUNCTION private.prevent_opportunity_relation_move();

DROP TRIGGER IF EXISTS trg_opportunity_hourly_parent_immutable
    ON public.opportunity_hourly;
CREATE TRIGGER trg_opportunity_hourly_parent_immutable
    BEFORE UPDATE OF opportunity_id ON public.opportunity_hourly
    FOR EACH ROW
    EXECUTE FUNCTION private.prevent_opportunity_relation_move();

DROP TRIGGER IF EXISTS trg_opportunity_required_skills_parent_immutable
    ON public.opportunity_required_skills;
CREATE TRIGGER trg_opportunity_required_skills_parent_immutable
    BEFORE UPDATE OF opportunity_id ON public.opportunity_required_skills
    FOR EACH ROW
    EXECUTE FUNCTION private.prevent_opportunity_relation_move();

DROP TRIGGER IF EXISTS trg_opportunities_integrity ON public.opportunities;
CREATE CONSTRAINT TRIGGER trg_opportunities_integrity
    AFTER INSERT OR UPDATE OR DELETE ON public.opportunities
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_company_opportunity_integrity();

DROP TRIGGER IF EXISTS trg_opportunity_employment_integrity ON public.opportunity_employment;
CREATE CONSTRAINT TRIGGER trg_opportunity_employment_integrity
    AFTER INSERT OR UPDATE OR DELETE ON public.opportunity_employment
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_company_opportunity_integrity();

DROP TRIGGER IF EXISTS trg_opportunity_project_integrity ON public.opportunity_project;
CREATE CONSTRAINT TRIGGER trg_opportunity_project_integrity
    AFTER INSERT OR UPDATE OR DELETE ON public.opportunity_project
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_company_opportunity_integrity();

DROP TRIGGER IF EXISTS trg_opportunity_hourly_integrity ON public.opportunity_hourly;
CREATE CONSTRAINT TRIGGER trg_opportunity_hourly_integrity
    AFTER INSERT OR UPDATE OR DELETE ON public.opportunity_hourly
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_company_opportunity_integrity();

DROP TRIGGER IF EXISTS trg_opportunity_required_skills_integrity
    ON public.opportunity_required_skills;
CREATE CONSTRAINT TRIGGER trg_opportunity_required_skills_integrity
    AFTER INSERT OR UPDATE OR DELETE ON public.opportunity_required_skills
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_company_opportunity_integrity();

CREATE OR REPLACE FUNCTION public.save_company_opportunity(
    p_opportunity_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_contract_type TEXT,
    p_status TEXT,
    p_subtype JSONB,
    p_required_skill_ids UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_role TEXT;
    v_account_status TEXT;
    v_existing_contract_type TEXT;
    v_existing_owner UUID;
    v_company_name TEXT;
    v_opportunity_id UUID;
    v_skill_count INTEGER;
    v_distinct_skill_count INTEGER;
    v_active_skill_count INTEGER;
    v_today DATE :=
        pg_catalog.timezone('Asia/Tokyo', pg_catalog.clock_timestamp())::DATE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'authentication required' USING ERRCODE = '42501';
    END IF;

    SELECT role, status
    INTO v_role, v_account_status
    FROM public.users
    WHERE id = v_uid;

    IF v_role IS DISTINCT FROM 'COMPANY' OR v_account_status IS DISTINCT FROM 'ACTIVE' THEN
        RAISE EXCEPTION 'active company account required' USING ERRCODE = '42501';
    END IF;

    IF p_title IS NULL OR pg_catalog.btrim(p_title) = ''
       OR pg_catalog.char_length(p_title) > 100 THEN
        RAISE EXCEPTION 'invalid opportunity title' USING ERRCODE = '22023';
    END IF;

    IF p_description IS NULL OR pg_catalog.btrim(p_description) = ''
       OR pg_catalog.char_length(p_description) > 3000 THEN
        RAISE EXCEPTION 'invalid opportunity description' USING ERRCODE = '22023';
    END IF;

    IF p_contract_type IS NULL
       OR p_contract_type NOT IN ('employment', 'project', 'hourly')
       OR p_status IS NULL
       OR p_status NOT IN ('draft', 'published', 'closed')
       OR p_subtype IS NULL
       OR pg_catalog.jsonb_typeof(p_subtype) <> 'object' THEN
        RAISE EXCEPTION 'invalid opportunity payload' USING ERRCODE = '22023';
    END IF;

    IF p_required_skill_ids IS NULL THEN
        RAISE EXCEPTION 'required skills are missing' USING ERRCODE = '22023';
    END IF;

    SELECT count(*), count(DISTINCT skill_id)
    INTO v_skill_count, v_distinct_skill_count
    FROM pg_catalog.unnest(p_required_skill_ids) AS skill_rows(skill_id);

    IF v_skill_count < 1 OR v_skill_count > 10
       OR v_distinct_skill_count <> v_skill_count THEN
        RAISE EXCEPTION 'required skill count must be between 1 and 10 with no duplicates'
            USING ERRCODE = '22023';
    END IF;

    SELECT count(*) INTO v_active_skill_count
    FROM public.skills
    WHERE id = ANY (p_required_skill_ids)
      AND is_active = TRUE;

    IF v_active_skill_count <> v_skill_count THEN
        RAISE EXCEPTION 'required skills must reference active master rows'
            USING ERRCODE = '22023';
    END IF;

    IF p_status = 'published' THEN
        SELECT company_name INTO v_company_name
        FROM public.company_profiles
        WHERE id = v_uid;

        IF v_company_name IS NULL OR pg_catalog.btrim(v_company_name) = '' THEN
            RAISE EXCEPTION 'company_name_required' USING ERRCODE = '22023';
        END IF;
    END IF;

    -- Validate subtype-specific fields before writing the parent.
    IF p_contract_type = 'employment' THEN
        IF (p_subtype ->> 'work_style') IS NULL
           OR (p_subtype ->> 'work_style') NOT IN ('REMOTE', 'ONSITE', 'HYBRID')
           OR (p_subtype ->> 'salary_min') IS NULL
           OR (p_subtype ->> 'salary_max') IS NULL
           OR (p_subtype ->> 'salary_min')::INTEGER NOT BETWEEN 1 AND 9999
           OR (p_subtype ->> 'salary_max')::INTEGER NOT BETWEEN 1 AND 9999
           OR (p_subtype ->> 'salary_min')::INTEGER >
              (p_subtype ->> 'salary_max')::INTEGER THEN
            RAISE EXCEPTION 'invalid employment payload' USING ERRCODE = '22023';
        END IF;
    ELSIF p_contract_type = 'project' THEN
        IF (p_subtype ->> 'deadline') IS NULL
           OR (p_subtype ->> 'budget') IS NULL
           OR (p_subtype ->> 'headcount') IS NULL
           OR (p_subtype ->> 'deadline')::DATE < v_today
           OR (p_subtype ->> 'budget')::INTEGER < 1
           OR (p_subtype ->> 'headcount')::INTEGER < 1
           OR pg_catalog.jsonb_typeof(p_subtype -> 'is_online') IS DISTINCT FROM 'boolean' THEN
            RAISE EXCEPTION 'invalid project payload' USING ERRCODE = '22023';
        END IF;
    ELSE
        IF (p_subtype ->> 'period_start') IS NULL
           OR (p_subtype ->> 'period_end') IS NULL
           OR (p_subtype ->> 'time_start') IS NULL
           OR (p_subtype ->> 'time_end') IS NULL
           OR (p_subtype ->> 'hourly_rate') IS NULL
           OR (p_subtype ->> 'headcount') IS NULL
           OR (p_subtype ->> 'work_style') IS NULL
           OR (p_subtype ->> 'period_start')::DATE >
              (p_subtype ->> 'period_end')::DATE
           OR (p_subtype ->> 'time_start')::TIME >=
              (p_subtype ->> 'time_end')::TIME
           OR (p_subtype ->> 'hourly_rate')::INTEGER < 1
           OR (p_subtype ->> 'headcount')::INTEGER < 1
           OR pg_catalog.jsonb_typeof(p_subtype -> 'is_online') IS DISTINCT FROM 'boolean'
           OR (p_subtype ->> 'work_style') NOT IN ('REMOTE', 'ONSITE', 'HYBRID') THEN
            RAISE EXCEPTION 'invalid hourly payload' USING ERRCODE = '22023';
        END IF;
    END IF;

    IF p_opportunity_id IS NULL THEN
        INSERT INTO public.opportunities (
            side,
            contract_type,
            title,
            description,
            status,
            posted_by
        )
        VALUES (
            'ENGINEER',
            p_contract_type,
            pg_catalog.btrim(p_title),
            p_description,
            p_status,
            v_uid
        )
        RETURNING id INTO v_opportunity_id;
    ELSE
        SELECT contract_type, posted_by
        INTO v_existing_contract_type, v_existing_owner
        FROM public.opportunities
        WHERE id = p_opportunity_id
          AND deleted_at IS NULL
        FOR UPDATE;

        IF NOT FOUND OR v_existing_owner IS DISTINCT FROM v_uid THEN
            RAISE EXCEPTION 'opportunity not found or not owned by caller'
                USING ERRCODE = '42501';
        END IF;

        IF v_existing_contract_type IS DISTINCT FROM p_contract_type THEN
            RAISE EXCEPTION 'opportunity contract type is immutable'
                USING ERRCODE = '22023';
        END IF;

        v_opportunity_id := p_opportunity_id;

        UPDATE public.opportunities
        SET title = pg_catalog.btrim(p_title),
            description = p_description,
            status = p_status
        WHERE id = v_opportunity_id;
    END IF;

    IF p_contract_type = 'employment' THEN
        INSERT INTO public.opportunity_employment (
            opportunity_id,
            work_style,
            salary_min,
            salary_max
        )
        VALUES (
            v_opportunity_id,
            p_subtype ->> 'work_style',
            (p_subtype ->> 'salary_min')::INTEGER,
            (p_subtype ->> 'salary_max')::INTEGER
        )
        ON CONFLICT (opportunity_id) DO UPDATE
        SET work_style = EXCLUDED.work_style,
            salary_min = EXCLUDED.salary_min,
            salary_max = EXCLUDED.salary_max;
    ELSIF p_contract_type = 'project' THEN
        INSERT INTO public.opportunity_project (
            opportunity_id,
            deadline,
            budget,
            headcount,
            is_online
        )
        VALUES (
            v_opportunity_id,
            (p_subtype ->> 'deadline')::DATE,
            (p_subtype ->> 'budget')::INTEGER,
            (p_subtype ->> 'headcount')::INTEGER,
            (p_subtype ->> 'is_online')::BOOLEAN
        )
        ON CONFLICT (opportunity_id) DO UPDATE
        SET deadline = EXCLUDED.deadline,
            budget = EXCLUDED.budget,
            headcount = EXCLUDED.headcount,
            is_online = EXCLUDED.is_online;
    ELSE
        INSERT INTO public.opportunity_hourly (
            opportunity_id,
            period_start,
            period_end,
            time_start,
            time_end,
            hourly_rate,
            is_online,
            work_style,
            headcount
        )
        VALUES (
            v_opportunity_id,
            (p_subtype ->> 'period_start')::DATE,
            (p_subtype ->> 'period_end')::DATE,
            (p_subtype ->> 'time_start')::TIME,
            (p_subtype ->> 'time_end')::TIME,
            (p_subtype ->> 'hourly_rate')::INTEGER,
            (p_subtype ->> 'is_online')::BOOLEAN,
            p_subtype ->> 'work_style',
            (p_subtype ->> 'headcount')::INTEGER
        )
        ON CONFLICT (opportunity_id) DO UPDATE
        SET period_start = EXCLUDED.period_start,
            period_end = EXCLUDED.period_end,
            time_start = EXCLUDED.time_start,
            time_end = EXCLUDED.time_end,
            hourly_rate = EXCLUDED.hourly_rate,
            is_online = EXCLUDED.is_online,
            work_style = EXCLUDED.work_style,
            headcount = EXCLUDED.headcount;
    END IF;

    DELETE FROM public.opportunity_required_skills
    WHERE opportunity_id = v_opportunity_id;

    INSERT INTO public.opportunity_required_skills (opportunity_id, skill_id)
    SELECT v_opportunity_id, skill_id
    FROM pg_catalog.unnest(p_required_skill_ids) AS skill_rows(skill_id);

    RETURN v_opportunity_id;
END;
$$;

REVOKE ALL ON FUNCTION public.save_company_opportunity(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID[]
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_company_opportunity(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID[]
) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_company_opportunity(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID[]
) TO authenticated;
