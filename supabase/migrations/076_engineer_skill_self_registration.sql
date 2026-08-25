-- Review #18: /engineer/profile/edit technical skill registration -- let an
-- Engineer add a skill that doesn't exist in the public.skills catalog yet,
-- instead of being limited to whatever an admin has pre-seeded.
--
-- Why not just relax skills_admin_insert (022_master_table_policies.sql) to
-- let any authenticated Engineer insert anywhere in the catalog:
--   public.skills is shared, globally-visible master data -- every row is
--   readable by every authenticated user (skills_select_active) and is also
--   referenced by public.opportunity_required_skills (company job postings,
--   010_opportunity_required_skills.sql). An unrestricted INSERT grant would
--   let one Engineer's typo or junk text land in a catalog every other
--   Engineer and every company sees and searches, and (subcategory_id,name)
--   only rejects an exact duplicate -- it does nothing for near-duplicates
--   ("React" vs "react " vs "React ") sitting in curated categories.
--
-- Safe middle ground implemented here: an Engineer may INSERT a new row, but
-- only into one reserved "その他（ユーザー登録）" subcategory (never into the
-- admin-curated フロントエンド/バックエンド/インフラ・クラウド/データベース
-- groups), only as their own created_by, and only active + non-blank. The
-- application layer (src/lib/engineer/skills.ts) is expected to reuse an
-- existing skill (case-insensitive, trimmed) instead of calling this insert
-- path whenever one already matches, so this policy is the last-resort
-- backstop, not the primary de-dup mechanism -- hence the extra case-
-- insensitive unique index below, which catches the race the application
-- check alone cannot (two Engineers submitting the same new name at once).
--
-- skills_admin_insert (022) is untouched and still applies -- Postgres ORs
-- multiple permissive policies for the same command, so admins keep
-- unrestricted INSERT into every subcategory.

-- Reserved bucket for Engineer-submitted skills. Idempotent: reruns and the
-- (category_id, name) unique index both make this a no-op after the first
-- apply. Only the TECHNICAL category is seeded anywhere in this schema
-- (033_skill_qualification_master_data.sql's header note), so there is
-- exactly one category row to join against.
INSERT INTO public.skill_subcategories (category_id, name, display_order)
SELECT sc.id, 'その他（ユーザー登録）', 99
FROM public.skill_categories sc
WHERE sc.code = 'TECHNICAL'
ON CONFLICT (category_id, name) DO NOTHING;

-- Tracks who submitted a self-registered skill (NULL for every admin-curated
-- row, past and future). Lets an admin later audit/re-categorize what
-- Engineers have added without needing a separate request/approval table.
ALTER TABLE public.skills
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_skills_created_by ON public.skills (created_by) WHERE created_by IS NOT NULL;

-- Case-insensitive, trim-insensitive duplicate guard scoped per subcategory.
-- The existing uq_skills_sub_name (subcategory_id, name) index
-- (003_master_tables.sql) is exact-match only; this closes the gap for two
-- concurrent submissions of the same name in different case/whitespace
-- landing in the same subcategory (in practice, the reserved "その他
-- （ユーザー登録）" bucket, since that's the only one Engineers can insert
-- into). Safe against existing data: none of the 14 seeded skill names
-- (033_skill_qualification_master_data.sql) collide case-insensitively
-- within the same subcategory.
CREATE UNIQUE INDEX IF NOT EXISTS uq_skills_sub_name_ci
    ON public.skills (subcategory_id, pg_catalog.lower(pg_catalog.btrim(name)));

DROP POLICY IF EXISTS skills_engineer_insert_self_registered ON public.skills;
CREATE POLICY skills_engineer_insert_self_registered
    ON public.skills
    FOR INSERT
    TO authenticated
    WITH CHECK (
        (SELECT private.current_user_role()) = 'ENGINEER'
        AND created_by = (SELECT auth.uid())
        AND is_active = TRUE
        AND pg_catalog.btrim(name) = name
        AND pg_catalog.length(name) BETWEEN 1 AND 50
        AND subcategory_id = (
            SELECT ssc.id
            FROM public.skill_subcategories ssc
            JOIN public.skill_categories sc ON sc.id = ssc.category_id
            WHERE sc.code = 'TECHNICAL'
              AND ssc.name = 'その他（ユーザー登録）'
        )
    );
