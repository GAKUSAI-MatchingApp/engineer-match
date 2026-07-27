-- Phase 5 決定事項③: company_profiles.industry の自由入力方式を廃止方向とし、
-- 業種マスタ選択方式へ段階的に移行する（Step 1 + Step 2）。
--
-- 既存データは一切破壊しない：
--   - company_profiles.industry (VARCHAR(50), free text, 004_profile_tables.sql)
--     はDROPしない。列定義・既存値とも変更しない。
--   - 新しい industry_category_id はNULLableなFKとして追加するのみ。
--   - 既存の company_profiles 行の industry_category_id は全て NULL のまま
--     とする。既存のフリーテキスト値（本ドラフト作成時点でQA環境上に確認できた
--     実例: "ソフトウェア開発", "QAテスト業界"）を業種マスタへ自動的に
--     マッピングすることはしない -- "QAテスト業界" のように、初期候補の
--     どのカテゴリにも一意に対応しない値が現に存在するため、危険な推測変換を
--     避ける。移行は各企業がCompany Profile編集画面から改めて選択する
--     ことで行う（Step 6で将来判断されるlegacy列廃止までは、旧テキストは
--     読み取り専用の参考情報として保持される）。
--
-- テーブル設計は既存master-dataパターン (skill_categories,
-- 003_master_tables.sql) を踏襲: id UUID PK, name, display_order, is_active,
-- created_at, updated_at。skill_categoriesと異なりindustry_categoriesは
-- 固定enumのcodeを持たない（自由に追加・編集可能な一段のフラットマスタ）ため、
-- code列は持たない。
--
-- 初期候補16件は要件定義書側の指示に基づく日本向けMVP初期セットであり、
-- 過剰な細分化を避けた大分類。既存の業種マスタ実装は存在しなかったため、
-- 既存設計との衝突はない。

CREATE TABLE IF NOT EXISTS public.industry_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_industry_categories_name ON public.industry_categories (name);
CREATE INDEX IF NOT EXISTS idx_industry_categories_active ON public.industry_categories (is_active);
CREATE INDEX IF NOT EXISTS idx_industry_categories_display_order ON public.industry_categories (display_order);

DROP TRIGGER IF EXISTS trg_industry_categories_updated_at ON public.industry_categories;
CREATE TRIGGER trg_industry_categories_updated_at
    BEFORE UPDATE ON public.industry_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.industry_categories ENABLE ROW LEVEL SECURITY;

-- Mirrors skill_categories exactly, including the ADMIN SELECT bypass that
-- 052_master_data_admin_select.sql had to retrofit for the other 4 master
-- tables after discovering that a single `is_active = TRUE` SELECT policy
-- with no ADMIN bypass makes PostgREST's UPDATE...RETURNING fail with 403
-- the moment an admin disables a row (the just-updated row falls outside
-- every SELECT policy, including for the admin). Adding both policies from
-- the start avoids reintroducing that already-diagnosed bug.
DROP POLICY IF EXISTS industry_categories_select_active ON public.industry_categories;
CREATE POLICY industry_categories_select_active
    ON public.industry_categories
    FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

DROP POLICY IF EXISTS industry_categories_select_admin ON public.industry_categories;
CREATE POLICY industry_categories_select_admin
    ON public.industry_categories
    FOR SELECT
    TO authenticated
    USING ((SELECT private.current_user_role()) = 'ADMIN');

DROP POLICY IF EXISTS industry_categories_admin_insert ON public.industry_categories;
CREATE POLICY industry_categories_admin_insert
    ON public.industry_categories
    FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT private.current_user_role()) = 'ADMIN');

DROP POLICY IF EXISTS industry_categories_admin_update ON public.industry_categories;
CREATE POLICY industry_categories_admin_update
    ON public.industry_categories
    FOR UPDATE
    TO authenticated
    USING ((SELECT private.current_user_role()) = 'ADMIN')
    WITH CHECK ((SELECT private.current_user_role()) = 'ADMIN');

-- No DELETE policy, matching skill_categories/qualifications: is_active is
-- the only lifecycle control, so a referenced category can never be
-- destructively removed. (No RESTRICT-FK-blocks-delete story is even needed
-- here since delete is never exposed to any role via RLS in the first place.)

-- Initial MVP candidate set (RD-provided, Japan-focused, intentionally
-- coarse-grained). display_order matches the listed order; is_active
-- defaults to TRUE for all.
INSERT INTO public.industry_categories (name, display_order) VALUES
    ('IT・ソフトウェア', 10),
    ('インターネット・Web', 20),
    ('通信', 30),
    ('コンサルティング', 40),
    ('金融・FinTech', 50),
    ('製造', 60),
    ('医療・ヘルスケア', 70),
    ('教育', 80),
    ('人材・HR', 90),
    ('不動産', 100),
    ('小売・EC', 110),
    ('物流', 120),
    ('広告・メディア', 130),
    ('ゲーム・エンタメ', 140),
    ('官公庁・公共', 150),
    ('その他', 160)
ON CONFLICT (name) DO NOTHING;

-- Step 2: additive, nullable FK on company_profiles. ON DELETE RESTRICT
-- mirrors skill_subcategories.category_id's convention (categories are never
-- hard-deleted via any exposed RLS policy anyway, per the no-DELETE-policy
-- note above, so RESTRICT is a belt-and-suspenders guarantee, not a live risk).
ALTER TABLE public.company_profiles
    ADD COLUMN IF NOT EXISTS industry_category_id UUID
        REFERENCES public.industry_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS idx_company_profiles_industry_category
    ON public.company_profiles (industry_category_id);

-- No RLS change needed on company_profiles: company_profiles_select_all
-- (023_profile_policies.sql) is unrestricted SELECT for authenticated users
-- (BR-18, company profiles are always public), and company_profiles_update_own
-- already permits the owning COMPANY to update any column on their own row,
-- with no per-column restriction analogous to users_update_own's protected
-- triad -- adding a new nullable column requires no policy change.

-- Rollback (in reverse order):
--   ALTER TABLE public.company_profiles DROP COLUMN IF EXISTS industry_category_id;
--   DROP TABLE IF EXISTS public.industry_categories;
-- Both are safe: no existing company_profiles row references
-- industry_category_id (nothing has been written to it besides this
-- migration's own NULL default), so RESTRICT never blocks this rollback.
