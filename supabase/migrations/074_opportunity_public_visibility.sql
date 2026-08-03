-- Landing page "Featured Jobs" fix.
--
-- Root cause: the landing page (src/app/page.tsx -> listFeaturedOpportunities,
-- src/lib/landing/featured-opportunities.ts) reads public.opportunities on
-- the visitor's own session via the cookie-bound SSR client
-- (src/lib/supabase/server.ts). A logged-out visitor has no session, so
-- PostgREST evaluates the query as role `anon`. opportunities_select_active
-- (024_opportunity_policies.sql) grants SELECT to `authenticated` only --
-- there is no `anon` policy on this table -- so the query legitimately
-- returned zero rows for every anonymous visitor, regardless of how many
-- published opportunities existed.
--
-- Fix: add ONE additional SELECT policy, scoped to `anon` only, with the
-- exact same predicate as opportunities_select_active. This does not touch
-- or replace opportunities_select_active (still governs `authenticated`
-- reads unchanged) or any other existing policy (own/admin select, insert,
-- update, delete) -- those remain authenticated-only exactly as before.
--
-- Deliberately scoped to public.opportunities only, matching the minimum
-- needed to un-block the landing page's own query. Companion detail (salary,
-- budget, hourly rate, required skills) still requires `authenticated` today
-- via opportunity_employment/_project/_hourly and opportunity_required_skills
-- -- an anonymous visitor will see title/company/contract-type but not those
-- fields, since FeaturedOpportunities (src/components/sections/
-- FeaturedOpportunities.tsx) already renders them conditionally. Broadening
-- those subtype tables to `anon` as well is a separate decision, not made
-- here.
DROP POLICY IF EXISTS opportunities_select_active_anon ON public.opportunities;
CREATE POLICY opportunities_select_active_anon
    ON public.opportunities
    FOR SELECT
    TO anon
    USING (
        status = 'published'
        AND unpublished_by_admin = FALSE
        AND deleted_at IS NULL
    );
