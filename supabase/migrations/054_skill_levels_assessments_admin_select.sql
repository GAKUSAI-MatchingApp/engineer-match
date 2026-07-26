-- Defense-in-depth companion to 052_master_data_admin_select.sql.
--
-- skill_levels and skill_assessments have the exact same SELECT-policy shape
-- that caused the is_active-toggle bug fixed in 052 for skill_categories/
-- skill_subcategories/skills/qualifications: a single `is_active = TRUE`
-- policy with no ADMIN bypass (022_master_table_policies.sql for
-- skill_levels; 030_skill_assessments.sql for skill_assessments).
--
-- Unlike the 052 case, this is NOT a live/reachable bug today:
--   - skill_levels has no is_active toggle anywhere in the admin UI at all
--     (MasterDataList.tsx's TOGGLEABLE_TABS deliberately excludes
--     "skillLevels" -- only name/description are editable, per
--     src/lib/admin/master-data.ts's own "no add/delete/active toggle...
--     per the narrow scope requested" comment).
--   - skill_assessments has no admin UI at all; it's only read by the
--     engineer-facing self-assessment flow.
-- So no code path exists today that could hit the 403/rollback. This
-- migration closes the latent gap anyway, at zero behavioral risk, so the
-- schema is consistent and ready if either toggle is ever built.

DROP POLICY IF EXISTS skill_levels_select_admin ON public.skill_levels;
CREATE POLICY skill_levels_select_admin
    ON public.skill_levels
    FOR SELECT
    TO authenticated
    USING ((SELECT private.current_user_role()) = 'ADMIN');

DROP POLICY IF EXISTS skill_assessments_select_admin ON public.skill_assessments;
CREATE POLICY skill_assessments_select_admin
    ON public.skill_assessments
    FOR SELECT
    TO authenticated
    USING ((SELECT private.current_user_role()) = 'ADMIN');
