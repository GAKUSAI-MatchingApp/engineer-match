-- Engineer Profile compensation fields, review #16: consolidate the six
-- 単価/年収 fields down to three -- 希望単価/最低単価 (both 円/時間, required)
-- and 希望年収 (円/年, optional).
--
-- desired_hourly_rate_min/max (039_engineer_profile_professional_fields.sql)
-- are already stored in 円/時間 (confirmed against production seed data --
-- values like 3098-7648), so they are reused as-is, just promoted from
-- optional to required. desired_rate_min/max (万円/月) and
-- desired_annual_income_min/max (万円/年) are dropped from the required-
-- fields trigger and from the application -- but NOT dropped from the
-- schema here, since existing rows still hold real (demo) data and no
-- other part of the app depends on removing the columns outright.
--
-- desired_annual_income_yen is a NEW single column (円/年) -- the old
-- desired_annual_income_min/max pair cannot be reinterpreted in place: it
-- is a different unit (万円, not 円) AND a different shape (a min/max pair,
-- not a single value). Reusing either column directly would silently
-- misread a 万円 figure as 円 (a 10,000x error). Existing values are
-- preserved by backfilling from desired_annual_income_max * 10000 --
-- max is used (not min) to mirror desired_hourly_rate_max's role as the
-- "希望" (desired) figure, consistent with how the two hourly-rate columns
-- are labeled below.

ALTER TABLE public.engineer_profiles
    ADD COLUMN IF NOT EXISTS desired_annual_income_yen INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'chk_engineer_profiles_annual_income_yen'
          AND conrelid = 'public.engineer_profiles'::regclass
    ) THEN
        ALTER TABLE public.engineer_profiles
            ADD CONSTRAINT chk_engineer_profiles_annual_income_yen
            -- 1万円〜9999万円/年 expressed in 円, mirroring the old
            -- desired_annual_income_min/max BETWEEN 1 AND 9999 (万円) range.
            CHECK (desired_annual_income_yen BETWEEN 10000 AND 99990000);
    END IF;
END $$;

-- One-time backfill so existing engineers don't lose a previously-entered
-- 希望年収 just because the column shape/unit changed. Only rows that had a
-- value are touched; NULL stays NULL.
UPDATE public.engineer_profiles
SET desired_annual_income_yen = desired_annual_income_max * 10000
WHERE desired_annual_income_max IS NOT NULL
  AND desired_annual_income_yen IS NULL;

-- Required Engineer profile fields: swap desired_rate_min/max (retired
-- 万円/月 field) for desired_hourly_rate_min/max (now-required 円/時間
-- pair). prefecture / years_of_experience / work_style are unchanged.
CREATE OR REPLACE FUNCTION private.enforce_engineer_profile_required_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF NEW.prefecture IS NULL OR pg_catalog.btrim(NEW.prefecture) = ''
       OR NEW.years_of_experience IS NULL
       OR NEW.work_style IS NULL
       OR NEW.desired_hourly_rate_min IS NULL
       OR NEW.desired_hourly_rate_max IS NULL THEN
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
        desired_hourly_rate_min,
        desired_hourly_rate_max
    ON public.engineer_profiles
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_engineer_profile_required_fields();
