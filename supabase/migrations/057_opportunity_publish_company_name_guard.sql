-- RD-2026-001 BR-23/BR-27 remediation: an opportunity may never reach
-- status='published' while its owning company has no registered
-- company_name (NULL, empty, or whitespace-only). The application layer
-- already enforces this (src/lib/company/jobs.ts:
-- createCompanyOpportunity / updateCompanyOpportunity /
-- setCompanyOpportunityStatus, all checked before the write), but neither
-- opportunities_insert_own nor opportunities_update_own
-- (024_opportunity_policies.sql) can express a cross-table check like this
-- in a USING/WITH CHECK clause, so this trigger is the real boundary a
-- direct API call cannot bypass.
--
-- Only COMPANY-role users can ever insert/update opportunities
-- (opportunities_insert_own / opportunities_update_own both require
-- current_user_role() = 'COMPANY'), so posted_by always identifies a
-- company_profiles row when this trigger's status = 'published' branch can
-- fire; ADMIN moderation (updateOpportunityModeration in
-- src/lib/admin/opportunities.ts) never sets status to 'published' -- it can
-- only take a listing down or force-close it -- so this trigger never
-- interferes with admin actions. Draft saves (status <> 'published') are
-- completely unaffected, including drafts with no company_name at all.

CREATE OR REPLACE FUNCTION private.enforce_opportunity_publish_company_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_company_name TEXT;
BEGIN
    IF NEW.status = 'published' THEN
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
