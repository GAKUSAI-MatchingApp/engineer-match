-- Phase 6.5: validate opportunity constraints after historical-data cleanup.
--
-- Preconditions verified read-only before this migration was drafted:
--   * Every opportunities.description is at most 3000 characters.
--   * Every opportunity_hourly.work_style is non-NULL.
--
-- Data impact
--   None. VALIDATE CONSTRAINT scans existing rows and marks the constraints
--   validated; it does not rewrite application data.
--
-- Deployment note
--   Apply only after rerunning the precondition queries against the deployment
--   target. A concurrent violating write is already prevented by the existing
--   NOT VALID constraints from migration 066.

ALTER TABLE public.opportunities
    VALIDATE CONSTRAINT chk_opportunities_description_length;

ALTER TABLE public.opportunity_hourly
    VALIDATE CONSTRAINT chk_opportunity_hourly_work_style_required;
