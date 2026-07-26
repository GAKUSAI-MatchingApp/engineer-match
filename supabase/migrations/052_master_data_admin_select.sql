-- Fixes a live-verified bug: admin can never disable (is_active = false) a
-- skill_category / skill_subcategory / skill / qualification row.
--
-- 022_master_table_policies.sql gave each of these 4 tables exactly one
-- SELECT policy -- USING (is_active = TRUE) -- with no ADMIN bypass. PostgREST
-- implements .update(...).select() as UPDATE ... RETURNING, and the returned
-- row must satisfy a SELECT policy. The moment an admin flips is_active to
-- false, the just-updated row falls outside every SELECT policy (including
-- for the admin themselves), so RETURNING is rejected, PostgREST answers 403,
-- and the whole statement rolls back -- verified live, no partial write.
--
-- Fix: add a second, permissive SELECT policy per table for ADMIN, same
-- pattern already used for abuse_reports (028_admin_policies.sql:
-- abuse_reports_select_own + abuse_reports_select_admin). Postgres ORs
-- multiple permissive policies for the same command, so this doesn't
-- change visibility for non-admins -- they still only see is_active = TRUE
-- rows via the existing *_select_active policy.

DROP POLICY IF EXISTS skill_categories_select_admin ON public.skill_categories;
CREATE POLICY skill_categories_select_admin
    ON public.skill_categories
    FOR SELECT
    TO authenticated
    USING ((SELECT private.current_user_role()) = 'ADMIN');

DROP POLICY IF EXISTS skill_subcategories_select_admin ON public.skill_subcategories;
CREATE POLICY skill_subcategories_select_admin
    ON public.skill_subcategories
    FOR SELECT
    TO authenticated
    USING ((SELECT private.current_user_role()) = 'ADMIN');

DROP POLICY IF EXISTS skills_select_admin ON public.skills;
CREATE POLICY skills_select_admin
    ON public.skills
    FOR SELECT
    TO authenticated
    USING ((SELECT private.current_user_role()) = 'ADMIN');

DROP POLICY IF EXISTS qualifications_select_admin ON public.qualifications;
CREATE POLICY qualifications_select_admin
    ON public.qualifications
    FOR SELECT
    TO authenticated
    USING ((SELECT private.current_user_role()) = 'ADMIN');
