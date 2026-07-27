-- Phase 5 決定事項②: 時間清算（opportunity_hourly）にも勤務形態を追加する。
--
-- 正式な勤務形態は opportunity_employment と同じ3値
-- (REMOTE / ONSITE / HYBRID, chk_opportunity_employment_work_style,
-- 006_opportunity_employment.sql) に統一する。
--
-- 既存の is_online は直ちに削除・rename しない -- 既存データ・既存コード
-- (CreateJobForm.tsx の hourlyIsOnline, company/jobs.ts の
-- HourlyInput.is_online, 求人詳細画面の「オンライン可/不可」表示) との
-- 後方互換性を維持するため、legacy compatibility columnとして当面保持する。
-- is_online の廃止判断は、work_styleへの移行が十分に進んだ後の将来フェーズで
-- 別途行う。
--
-- 安全性:
--   - work_style は NULLable で追加する。既存の1件（このドラフト作成時点の
--     QA環境で確認済み）を含む既存行は is_online の値から自動変換しない --
--     is_online=true が REMOTE を意味するのか HYBRID を意味するのかは
--     一意に決定できず、危険な推測になるため。既存行の work_style は
--     NULLのまま残り、アプリ側は「未設定（レガシー）」として扱う。
--   - is_online は列定義・NOT NULL制約とも一切変更しない。
--   - 新規作成・編集時のみ、アプリケーション側で work_style の入力を必須とする
--     (DB制約としてのNOT NULLは、既存行を壊さないため付与しない)。
--   - CHECK制約は「NULL可、値がある場合のみ3値のいずれか」を保証する。
--   - RLSは変更不要 -- opportunity_hourly_select_via_opportunity /
--     _insert_owner / _update_owner (024_opportunity_policies.sql) は行全体に
--     対して定義されており、列追加によって挙動は変わらない。
--
-- Rollback: DROP CONSTRAINT chk_opportunity_hourly_work_style, then
-- ALTER TABLE public.opportunity_hourly DROP COLUMN work_style. Pure
-- rollback -- no data was migrated into the column by this migration, so
-- nothing is lost by dropping it again.

ALTER TABLE public.opportunity_hourly
    ADD COLUMN IF NOT EXISTS work_style VARCHAR(20);

ALTER TABLE public.opportunity_hourly
    DROP CONSTRAINT IF EXISTS chk_opportunity_hourly_work_style;
ALTER TABLE public.opportunity_hourly
    ADD CONSTRAINT chk_opportunity_hourly_work_style
    CHECK (work_style IS NULL OR work_style IN ('REMOTE', 'ONSITE', 'HYBRID'));
