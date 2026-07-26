-- Bug fix for 057_opportunity_publish_company_name_guard.sql, found during
-- live E2E testing of the admin takedown-reason feature (BR-91): the
-- original trigger checked `IF NEW.status = 'published'` on every UPDATE,
-- not only when a row is actually transitioning into 'published'. Admin
-- moderation (updateOpportunityModeration in src/lib/admin/opportunities.ts)
-- never touches the `status` column for a takedown -- it only flips
-- `unpublished_by_admin` to true, leaving status='published' unchanged --
-- so the old trigger re-ran the company_name check on every admin touch and
-- incorrectly blocked taking down (or otherwise moderating) any already-
-- published listing whose owning company has no registered company_name.
-- Live-confirmed: 5 of 7 currently-published opportunities in this
-- environment are posted by companies with no company_profiles row at all
-- (pre-existing test/QA data), so admin could not take any of them down
-- once 057 was applied -- exactly backwards, since those are the listings
-- BR-23/27 most wants an admin to be able to intervene on.
--
-- Fix: only run the check at the actual moment a row becomes published --
-- INSERT with status='published', or an UPDATE where OLD.status was
-- anything other than 'published' and NEW.status is now 'published'. A row
-- that is already published and stays published (admin toggling
-- unpublished_by_admin, or the company editing title/description while
-- status is untouched) no longer re-triggers the check. This matches the
-- literal requirement text (BR-23/27: company_name required "at publish
-- time"), not a continuous invariant on every subsequent touch -- and it is
-- the interpretation that keeps admin takedown/moderation working
-- regardless of the target company's profile completeness, which is the
-- correct behavior: an incomplete-profile company's listing must be
-- possible for an admin to intervene on, not permanently stuck.
--
-- No RLS policy, table, or row is modified. No existing data changed by
-- applying this migration -- it only replaces the trigger function body
-- (CREATE OR REPLACE) and re-runs a `DROP TRIGGER IF EXISTS` + `CREATE
-- TRIGGER` against the exact same trigger name and table as 057, which is
-- itself a safe no-op to re-run.

CREATE OR REPLACE FUNCTION private.enforce_opportunity_publish_company_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_company_name TEXT;
    v_becoming_published BOOLEAN;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_becoming_published := (NEW.status = 'published');
    ELSE
        v_becoming_published := (NEW.status = 'published' AND OLD.status IS DISTINCT FROM 'published');
    END IF;

    IF v_becoming_published THEN
        SELECT company_name INTO v_company_name
        FROM public.company_profiles
        WHERE id = NEW.posted_by;

        IF v_company_name IS NULL OR btrim(v_company_name) = '' THEN
            RAISE EXCEPTION 'opportunity cannot be published without a registered company_name'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_opportunities_publish_company_name ON public.opportunities;
CREATE TRIGGER trg_opportunities_publish_company_name
    BEFORE INSERT OR UPDATE ON public.opportunities
    FOR EACH ROW
    EXECUTE FUNCTION private.enforce_opportunity_publish_company_name();
