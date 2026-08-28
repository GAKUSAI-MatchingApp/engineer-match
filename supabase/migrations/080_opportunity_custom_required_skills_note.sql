-- Review #27: 求人・案件作成時、必須スキル一覧に存在しないスキルがある場合の
-- 受け皿として、求人ごとの自由記述欄を追加する。
--
-- 方針:
--   一覧にないスキルを public.skills の global master へ直接登録するのではなく
--   （Companyがglobal skillを作成できる機能は追加しない）、求人ごとの補足情報
--   として opportunities.custom_required_skills_note に保持する。
--   opportunity_required_skills / public.skills は一切変更しない -- この自由
--   記述はスキルマスタとは完全に分離されたテキストであり、Engineer側の
--   skill_idベースの求人検索・絞り込み（listPublishedOpportunities の
--   resolveSkillAndFilterIds等）には一切含めない。求人詳細画面に表示するだけの
--   補足情報として扱う。
--
-- Review #26 との整合性:
--   Engineerが自由登録したuser-created skill（created_by IS NOT NULL,
--   076_engineer_skill_self_registration.sql）をCompanyの共通候補
--   （listSkills）に表示しない方針は維持する。この自由記述欄は
--   public.skills に一切書き込まないため、#26の方針と衝突しない。
--
--   加えて、旧7引数版RPCは is_active = TRUE のみを検証しており、
--   created_by IS NOT NULL のuser-created skillをrequired skillとして
--   DBレベルでは禁止していなかった（UI側のlistSkills()フィルタのみに
--   依存）。本migration作成時点でopportunity_required_skillsを調査した
--   ところ、user-created skillを参照する行は0件だったため、既存データへの
--   影響なしにDBレベルの禁止を追加できると判断し、8引数版のみ
--   created_by IS NULL を追加検証する（下記 v_active_skill_count 参照）。
--   7引数版（レガシー）はこの検証を追加せず、元の挙動のまま残す。
--
-- 安全性:
--   - custom_required_skills_note は NULLable で追加する。既存求人は全件
--     NULLのまま残り、表示・編集とも問題なく動作する。
--   - 長さ制約（500文字以内）は既存行が全てNULLのため、NOT VALIDにせず
--     通常のVALID CHECKとして追加してよい（既存行は自明に条件を満たす）。
--   - public.skills / opportunity_required_skills のRLS・構造は変更しない。
--
-- デプロイ互換性 (function overload):
--   save_company_opportunity() は列を1つ追加した新シグネチャが必要だが、この
--   migrationでは 066_atomic_company_opportunity_save.sql が作成した
--   7引数版 (UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID[]) を DROP しない。
--   代わりに 8引数版 (末尾に p_custom_required_skills_note TEXT を追加) を
--   PostgreSQLのfunction overloadとして新規追加し、しばらく両方を共存させる。
--   これにより「migrationだけ先に適用し、frontendは後から切り替える」という
--   順序でも、旧frontend（7引数で呼び出す）は旧関数のまま動き続け、壊れない。
--   新frontend（本コミットのCompanyJobForm等、8引数で呼び出す）は自動的に
--   新しいオーバーロードに解決される。PostgRESTのRPC呼び出しは渡された引数名
--   の集合で一致するオーバーロードを選ぶため、7引数呼び出しと8引数呼び出しの
--   間に曖昧性は生じない。
--   旧7引数版の削除（cleanup）は、新frontendへの切替と動作確認が完了した後、
--   別migrationで行う（本migrationでは行わない）。
--
-- Rollback:
--   DROP FUNCTION public.save_company_opportunity(UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID[], TEXT);
--   -- 7引数版 (066) はこのmigrationで変更していないため、rollbackで復元する
--   -- 必要はない。
--   ALTER TABLE public.opportunities DROP COLUMN custom_required_skills_note;
--   Pure rollback -- no other data is migrated by this file.

ALTER TABLE public.opportunities
    ADD COLUMN IF NOT EXISTS custom_required_skills_note TEXT;

ALTER TABLE public.opportunities
    DROP CONSTRAINT IF EXISTS chk_opportunities_custom_required_skills_note_length;
ALTER TABLE public.opportunities
    ADD CONSTRAINT chk_opportunities_custom_required_skills_note_length
    CHECK (
        custom_required_skills_note IS NULL
        OR pg_catalog.char_length(custom_required_skills_note) <= 500
    );

-- Intentionally NOT dropping the existing 7-arg save_company_opportunity()
-- from 066_atomic_company_opportunity_save.sql here -- see the "デプロイ
-- 互換性" note above. The statement below adds a distinct 8-arg overload;
-- it does not touch the 7-arg function's definition or grants.
CREATE OR REPLACE FUNCTION public.save_company_opportunity(
    p_opportunity_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_contract_type TEXT,
    p_status TEXT,
    p_subtype JSONB,
    p_required_skill_ids UUID[],
    p_custom_required_skills_note TEXT
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
    v_custom_skills_note TEXT;
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

    -- Review #26 との整合性: Engineer自己登録スキル (created_by IS NOT NULL,
    -- 076_engineer_skill_self_registration.sql) はCompany側のlistSkills()が
    -- 既にUIから除外しているが、旧7引数版RPCはDBレベルでこれを強制していない
    -- （is_active=TRUEのみ検証）。デプロイ調査の結果、opportunity_required_skills
    -- に created_by IS NOT NULL のskill_idを参照する行は0件だった（本
    -- migration作成時点、read-only調査済み）ため、8引数版ではこの新シグネチャ
    -- に限りDBレベルでも禁止して二重に防御する。7引数版（レガシー、上では
    -- 変更していない）は元のis_active=TRUEのみの検証のまま据え置く。
    SELECT count(*) INTO v_active_skill_count
    FROM public.skills
    WHERE id = ANY (p_required_skill_ids)
      AND is_active = TRUE
      AND created_by IS NULL;

    IF v_active_skill_count <> v_skill_count THEN
        RAISE EXCEPTION 'required skills must reference active, admin-curated master rows'
            USING ERRCODE = '22023';
    END IF;

    -- Review #27: free-text supplement, never written to public.skills or
    -- opportunity_required_skills. Blank/whitespace-only collapses to NULL
    -- so an emptied textarea clears the note instead of storing "".
    v_custom_skills_note := NULLIF(pg_catalog.btrim(p_custom_required_skills_note), '');
    IF v_custom_skills_note IS NOT NULL
       AND pg_catalog.char_length(v_custom_skills_note) > 500 THEN
        RAISE EXCEPTION 'custom required skills note must be 500 characters or fewer'
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
            posted_by,
            custom_required_skills_note
        )
        VALUES (
            'ENGINEER',
            p_contract_type,
            pg_catalog.btrim(p_title),
            p_description,
            p_status,
            v_uid,
            v_custom_skills_note
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
            status = p_status,
            custom_required_skills_note = v_custom_skills_note
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
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID[], TEXT
) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_company_opportunity(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID[], TEXT
) FROM anon;
GRANT EXECUTE ON FUNCTION public.save_company_opportunity(
    UUID, TEXT, TEXT, TEXT, TEXT, JSONB, UUID[], TEXT
) TO authenticated;
