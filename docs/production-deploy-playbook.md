# ENGINEER MATCH Production Deploy Playbook

## Table of contents

1. [Purpose and scope](#1-purpose-and-scope)
2. [Mandatory release-security gate](#2-mandatory-release-security-gate)
3. [Pre-deployment safety gate](#3-pre-deployment-safety-gate)
4. [Create and configure the production Supabase project](#4-create-and-configure-the-production-supabase-project)
5. [Apply database migrations](#5-apply-database-migrations)
6. [Seed production master data](#6-seed-production-master-data)
7. [Verify RLS and database security](#7-verify-rls-and-database-security)
8. [Configure production Supabase Auth](#8-configure-production-supabase-auth)
9. [Configure Vercel Production environment variables](#9-configure-vercel-production-environment-variables)
10. [Deploy to Vercel Production](#10-deploy-to-vercel-production)
11. [Cut over DNS and the custom domain](#11-cut-over-dns-and-the-custom-domain)
12. [Rollback](#12-rollback)
13. [Final Go/No-Go gate](#13-final-gono-go-gate)
14. [Post-Go-Live monitoring](#14-post-go-live-monitoring)
15. [Known decisions and documentation discrepancies](#15-known-decisions-and-documentation-discrepancies)
16. [Operator record](#16-operator-record)

## 1. Purpose and scope

This runbook prepares the current ENGINEER MATCH repository for a first production deployment using Vercel, Supabase, and the version-controlled database migrations. It is an operator procedure, not authorization to deploy.

Repository facts verified for this revision:

- Expected Git revision at the start of Phase 7: `93f1022`.
- Database migration range: `001_extensions.sql` through `070_validate_opportunity_constraints.sql`, inclusive.
- There is no migration `071`.
- The application uses Next.js 16.2.10 and the Supabase SSR/browser clients.
- Public registration is implemented for Engineer and Company accounts.
- Production master data is installed by migrations; there is no separate production seed script.
- Phase 6 QA-only skills and all QA/demo/business rows are outside production scope.

The operator must replace every angle-bracket placeholder locally or in a provider dashboard. Never place real credentials in this document, source control, screenshots, tickets, or terminal output retained as release evidence.

## 2. Mandatory release-security gate

The following historically exposed demo identities are retained **only** for final testing:

- `demo-engineer@engineer-match.jp`
- `demo-company@engineer-match.jp`
- `admin@example.com`

Do not record or reproduce their passwords.

Before `SAFE TO RELEASE` can become `YES`, an authorized operator must:

1. Rotate the credentials **or** disable/delete all three accounts.
2. Revoke all existing sessions for all three identities.
3. Verify that the former credentials can no longer authenticate.

Until evidence for all three steps is attached to the release record:

> **SAFE TO RELEASE = NO**

This gate applies even when every technical deployment and smoke check passes.

## 3. Pre-deployment safety gate

### 3.1 Release inputs

- [ ] Record the exact approved commit SHA; do not deploy a moving branch reference.
- [ ] Confirm the local and remote release SHA agree.
- [ ] Confirm `git status --short` contains no release-affecting changes.
- [ ] Confirm migrations are exactly `001`–`070` and no `071` exists.
- [ ] Confirm lint, typecheck, build, and the Phase 7 production verification checklist have approved evidence.
- [ ] Confirm production Supabase and Vercel ownership, billing, MFA, backup retention, and incident contacts.
- [ ] Name one deployment operator and one independent verifier.
- [ ] Define a maintenance window and a stop/rollback decision owner.

### 3.2 Environment identity safeguards

Create a written environment map before issuing any command:

| Environment | Supabase project name | Project ref | Database host | Vercel environment | Domain |
|---|---|---|---|---|---|
| QA/shared | `<qa-name>` | `<qa-ref>` | `<qa-host>` | Preview | `<qa-domain>` |
| Production | `<production-name>` | `<production-ref>` | `<production-host>` | Production | `<production-domain>` |

Required safeguards:

- Use a visibly production-specific project name and terminal profile.
- Read the target project ref and host back to the independent verifier.
- Never infer the target from the last linked Supabase project.
- Never copy the QA/shared database into production.
- Never use a QA service key, database password, URL, or anon key in Production.
- Never display secret values in release evidence.
- Run read-only identity checks immediately before and after each database stage.
- Stop if any project ref, host, migration history, or row count differs from the approved record.

## 4. Create and configure the production Supabase project

1. Create a new Supabase project in the approved production organization and region.
2. Store the generated database password in the approved secrets manager; do not put it in `.env` files or this repository.
3. Require MFA for provider administrators and keep at least two authorized organization owners.
4. Select a paid plan/compute size that will not be paused and is appropriate for expected launch traffic.
5. Confirm daily backup retention; select PITR if the business recovery-point objective requires it.
6. Enable SSL enforcement and review database network restrictions.
7. Review Supabase Security Advisor and Performance Advisor before Go-Live.
8. Do not enable public table access as a workaround for an RLS failure.

Supabase’s current production checklist covers RLS, SSL enforcement, network restrictions, MFA, email confirmation, SMTP, backups, and load planning. Use it as an external provider checklist in addition to this repository-specific runbook: [Supabase Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod).

## 5. Apply database migrations

### 5.1 Verified range and fresh-production constraint

Apply every migration in lexical/numeric order:

```text
001_extensions.sql
...
068_application_integrity_hardening.sql
069_last_admin_invariant_hardening.sql
070_validate_opportunity_constraints.sql
```

Latest migration: `070_validate_opportunity_constraints.sql`.

**Do not perform a blind one-shot `001`–`070` push into an empty project.** Migration `069` aborts when no ACTIVE Admin exists. A fresh production database has no application users, so the initial Admin must be bootstrapped after `068` and before `069`.

### 5.2 Recommended fresh-project procedure: staged manual application

The repository has no `supabase/config.toml`, no Supabase CLI dependency, and its existing QA/shared history has been managed manually. For the first production project, the controlled Supabase Studio procedure is therefore the supported path for this repository revision.

#### Stage A — migrations 001–068

For each file from `001_extensions.sql` to `068_application_integrity_hardening.sql`:

1. Open the **Production** project in Supabase Studio.
2. Reconfirm the production project ref against the environment map.
3. Open the migration file from the approved commit, without editing it.
4. Apply exactly one file at a time in numeric order.
5. Record file name, start/end time, outcome, operator, and query-run identifier.
6. Stop on the first error. Do not skip, reorder, or modify a migration in Studio.

After `068`, run the read-only checks in sections 5.5 and 7 before continuing.

#### Stage B — bootstrap the first production Admin

The public signup UI does not create Admin users, and the `auth.users` creation trigger accepts application roles rather than `ADMIN`. Use a dedicated production operator identity, never one of the historical demo identities:

1. In an isolated operator session, run the approved release build against Production without persisting or printing its Production configuration, and create a dedicated bootstrap account through the implemented **Company** registration flow. Do not expose this temporary bootstrap path publicly. This keeps Auth, `public.users`, and the Company profile creation consistent with the application.
2. Complete email confirmation and record its exact Auth UUID and email.
3. In Production SQL Editor, have two operators verify that the target UUID/email is the dedicated bootstrap identity.
4. In a controlled transaction, update exactly that `public.users` row from `COMPANY` to `ADMIN`, require `status = 'ACTIVE'`, and abort unless exactly one row is affected.
5. Verify read-only that Auth UUID, public user UUID, email, role `ADMIN`, and status `ACTIVE` match.
6. After the approved Production application is deployed, sign in and verify the Admin landing page as part of the smoke checklist, then sign out.

The bootstrap may leave an unused `company_profiles` row associated with the identity. Do not improvise a cleanup; approve whether to retain or remove it as part of the bootstrap procedure. Do not use a service-role key in Vercel or browser code. If policy requires a provider-side Admin API instead of the registration bootstrap, document, test, and approve that separate secure procedure before deployment.

#### Stage C — migrations 069–070

1. Apply `069_last_admin_invariant_hardening.sql`.
2. Run the Admin invariant checks in section 7.4.
3. Apply `070_validate_opportunity_constraints.sql`.
4. Run the opportunity-integrity checks in section 7.5.
5. Run all compact database checks in sections 5.5 and 7.

### 5.3 Conditional Supabase CLI approach

Supabase documents `supabase login`, `supabase link`, `supabase migration list`, and `supabase db push`, with applied history stored in `supabase_migrations.schema_migrations`: [Supabase database migrations](https://supabase.com/docs/guides/deployment/database-migrations) and [CLI reference](https://supabase.com/docs/reference/cli/overview).

CLI use is **conditional** for this repository:

- First prove the repository’s three-digit filenames and migration history in a disposable project.
- Reconcile any Studio-applied history before using `db push`.
- Reconfirm the linked project ref immediately before every command.
- Do not use a one-shot push on an empty project because of the `069` Admin precondition.
- Do not move, rename, or temporarily hide committed migration files to force a range.

Example read-only preflight after the repository is formally configured for CLI:

```powershell
supabase projects list
supabase link --project-ref <production-project-ref>
supabase migration list
```

Only an approved production workflow may run:

```powershell
supabase db push --dry-run
supabase db push
```

If the installed CLI does not support `--dry-run`, stop rather than substituting an unreviewed command. Never pass a database password inline or capture it in logs.

### 5.4 Manual-history safeguard

Studio execution does not automatically prove that every local migration is represented in CLI history. The release record must preserve an immutable ledger of the 70 filenames and successful execution evidence. Do not fabricate or repair migration-history rows without an approved reconciliation plan.

After Go-Live, adopt version-controlled migrations and an approval workflow rather than making ad hoc Production schema changes in Studio, consistent with the [Supabase maturity model](https://supabase.com/docs/guides/deployment/maturity-model).

### 5.5 Read-only migration verification

Run in Production SQL Editor:

```sql
-- If this project uses Supabase CLI migration history.
select version, name
from supabase_migrations.schema_migrations
order by version;
```

Expected result for a reconciled CLI history: 70 ordered versions, first `001`, last `070`. If the manual ledger is authoritative, attach that ledger and explicitly mark the CLI history query `N/A — manual application`.

Structural latest-version checks:

```sql
select
  to_regprocedure('private.current_user_role()') is not null
    as migration_067_function_exists,
  to_regprocedure('private.enforce_application_status_transition()') is not null
    as migration_068_function_exists,
  to_regclass('private.admin_invariant_state') is not null
    as migration_069_state_exists;

select conname, convalidated
from pg_constraint
where conname in (
  'chk_opportunities_description_length',
  'chk_opportunity_hourly_work_style_required'
)
order by conname;
```

Expected: all three structural booleans are `true`; both constraints exist and `convalidated` is `true`.

## 6. Seed production master data

### 6.1 Required master tables

The production application reads these version-controlled master domains:

- `public.skill_levels`
- `public.skill_categories`
- `public.skill_subcategories`
- `public.skills`
- `public.qualifications`
- `public.industry_categories`
- `public.skill_assessments`
- `public.skill_assessment_questions`

### 6.2 Actual seed mechanism

There is no separate production seed file or package script. Required master rows are inserted idempotently by:

- `030_skill_assessments.sql`
- `031_business_skill_assessments.sql`
- `033_skill_qualification_master_data.sql`
- `064_industry_categories.sql`

Therefore production master-data seed readiness is:

> **READY THROUGH ORDERED MIGRATIONS; NO SEPARATE SEED COMMAND EXISTS**

After migrations, record read-only counts and sample stable keys for each table. Compare them with the approved migration definitions, not QA row counts.

```sql
select 'skill_levels' as table_name, count(*) from public.skill_levels
union all select 'skill_categories', count(*) from public.skill_categories
union all select 'skill_subcategories', count(*) from public.skill_subcategories
union all select 'skills', count(*) from public.skills
union all select 'qualifications', count(*) from public.qualifications
union all select 'industry_categories', count(*) from public.industry_categories
union all select 'skill_assessments', count(*) from public.skill_assessments
union all select 'skill_assessment_questions', count(*) from public.skill_assessment_questions
order by table_name;
```

Never migrate:

- QA/shared database contents;
- demo users or credentials;
- QA applications, messages, notifications, reviews, profiles, or opportunities;
- real business/customer records from another environment;
- Phase 6 QA-only skills or other temporary QA master rows.

## 7. Verify RLS and database security

All queries in this section are read-only catalog or aggregate checks. Do not weaken policies to make a check pass.

### 7.1 RLS coverage

```sql
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
order by c.relname;
```

Expected: every application-facing `public` table reports `rls_enabled = true`. Any false row is No-Go pending review.

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Review policy output against migrations `020`–`029`, `032`, `035`, `050`, `052`–`054`, and `065`–`068`.

### 7.2 Migration 067 — ACTIVE-account authorization

Verify the helper and its hardened properties:

```sql
select
  n.nspname as schema_name,
  p.proname,
  p.prosecdef as security_definer,
  p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where (n.nspname, p.proname) in (
  ('private', 'current_user_role'),
  ('public', 'admin_write_audit_log')
)
order by n.nspname, p.proname;
```

Expected: both functions exist and are `SECURITY DEFINER`; `proconfig` shows the fixed search path defined by migration `067`. Review the `067` policy definitions for the ACTIVE-account predicate across role-owned data. Functional cross-role checks belong in the production verification checklist.

### 7.3 RPC grants and SECURITY DEFINER inventory

The client calls these RPCs:

- `public.admin_write_audit_log`
- `public.withdraw_own_account`
- `public.save_company_opportunity`

```sql
select
  n.nspname as schema_name,
  p.proname,
  p.prosecdef as security_definer,
  p.proconfig,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'admin_write_audit_log',
    'withdraw_own_account',
    'save_company_opportunity'
  )
order by p.proname;
```

Expected: no anonymous execute access; authenticated execute only where granted by the corresponding migration; each privileged function has the migration-defined fixed search path. Confirm there is no `PUBLIC` execute grant:

```sql
select routine_schema, routine_name, grantee, privilege_type
from information_schema.routine_privileges
where routine_schema in ('public', 'private')
  and routine_name in (
    'admin_write_audit_log',
    'withdraw_own_account',
    'save_company_opportunity',
    'current_user_role',
    'enforce_application_status_transition',
    'enforce_admin_status_protection'
  )
order by routine_schema, routine_name, grantee;
```

### 7.4 Migration 069 — last-active-Admin invariant

```sql
select singleton, active_admin_count
from private.admin_invariant_state;

select
  t.tgname,
  t.tgenabled,
  pg_get_triggerdef(t.oid) as trigger_definition
from pg_trigger t
where t.tgrelid = 'public.users'::regclass
  and t.tgname = 'trg_users_admin_status_protection'
  and not t.tgisinternal;

select
  p.prosecdef as security_definer,
  p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'private'
  and p.proname = 'enforce_admin_status_protection';

select
  (select active_admin_count
   from private.admin_invariant_state
   where singleton = true) as stored_count,
  count(*) filter (where role = 'ADMIN' and status = 'ACTIVE') as actual_count
from public.users;
```

Expected:

- exactly one state row with `singleton = true`;
- stored and actual ACTIVE Admin counts match and are at least one;
- enabled trigger covers `INSERT`, `UPDATE`, and `DELETE` on `public.users`;
- enforcement function is `SECURITY DEFINER` with a fixed empty search path.

Do not suspend/delete the only real Production Admin to test this branch. Use structural verification and separately approved disposable identities.

### 7.5 Migrations 068 and 070 — application and opportunity integrity

```sql
select conname, convalidated, pg_get_constraintdef(oid) as definition
from pg_constraint
where conname in (
  'chk_opportunities_description_length',
  'chk_opportunity_hourly_work_style_required'
)
order by conname;

select count(*) as published_hourly_null_work_style
from public.opportunities o
join public.opportunity_hourly h on h.opportunity_id = o.id
where o.status = 'PUBLISHED'
  and h.work_style is null;

select count(*) as published_invalid_engineer_subtype
from public.opportunities o
where o.status = 'PUBLISHED'
  and o.contract_type in ('EMPLOYMENT', 'PROJECT', 'HOURLY')
  and not (
    (
      o.contract_type = 'EMPLOYMENT'
      and exists (select 1 from public.opportunity_employment e where e.opportunity_id = o.id)
      and not exists (select 1 from public.opportunity_project p where p.opportunity_id = o.id)
      and not exists (select 1 from public.opportunity_hourly h where h.opportunity_id = o.id)
    )
    or (
      o.contract_type = 'PROJECT'
      and exists (select 1 from public.opportunity_project p where p.opportunity_id = o.id)
      and not exists (select 1 from public.opportunity_employment e where e.opportunity_id = o.id)
      and not exists (select 1 from public.opportunity_hourly h where h.opportunity_id = o.id)
    )
    or (
      o.contract_type = 'HOURLY'
      and exists (select 1 from public.opportunity_hourly h where h.opportunity_id = o.id)
      and not exists (select 1 from public.opportunity_employment e where e.opportunity_id = o.id)
      and not exists (select 1 from public.opportunity_project p where p.opportunity_id = o.id)
    )
  );

select count(*) as published_invalid_engineer_skill_count
from public.opportunities o
where o.status = 'PUBLISHED'
  and o.contract_type in ('EMPLOYMENT', 'PROJECT', 'HOURLY')
  and (
    select count(*)
    from public.opportunity_required_skills ors
    where ors.opportunity_id = o.id
  ) not between 1 and 20;
```

Expected: both constraints are validated and all three aggregate counts are zero.

Also verify `private.enforce_application_status_transition` exists, has its fixed search path, and its trigger is enabled on `public.applications`. Use the smoke checklist for allowed and rejected transitions.

## 8. Configure production Supabase Auth

Use the [Supabase redirect URL guidance](https://supabase.com/docs/guides/auth/redirect-urls), [password Auth guidance](https://supabase.com/docs/guides/auth/passwords), [SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp), and [session guidance](https://supabase.com/docs/guides/auth/sessions).

### 8.1 URLs and email

- [ ] Set Site URL to the approved canonical HTTPS production origin.
- [ ] Allow only required exact production redirect origins; keep Preview redirects separate and narrowly scoped.
- [ ] Enable email confirmation for public signup if required by the launch policy.
- [ ] Configure branded production email templates with correct links.
- [ ] Configure production-grade custom SMTP, sender domain authentication, delivery monitoring, and rate limits.
- [ ] Disable provider link tracking if it breaks single-use Auth links.
- [ ] Test Engineer and Company confirmation links from real mailbox providers.

### 8.2 Passwords and reset

- [ ] Configure a minimum password policy of at least the application’s effective eight-character expectation and consider leaked-password protection.
- [ ] Confirm generic login errors do not disclose whether an account exists.
- [ ] Make a Go/No-Go decision for password reset. The current login presents a forgot-password control, but no complete reset/recovery flow is implemented.
- [ ] Do not advertise password reset as available until end-to-end request, redirect, token handling, and password update are implemented and tested.

### 8.3 Sessions

- [ ] Approve session lifetime, inactivity timeout, refresh-token behavior, and single/multiple-session policy.
- [ ] Verify sign-out and account withdrawal invalidate application access.
- [ ] Establish an operator procedure to revoke sessions during security incidents.
- [ ] Complete the historical-demo credential and session gate in section 2 immediately before release.

### 8.4 Role registration and Admin bootstrap

- Engineer public registration: implemented.
- Company public registration: implemented.
- Admin public registration: intentionally unavailable; follow the controlled bootstrap in section 5.2.
- Instructor public registration: **not available in the current UI**, and no Instructor dashboard is available. Do not announce or test it as a public production role.

## 9. Configure Vercel Production environment variables

The repository reads exactly these application environment keys:

| Key | Production value | Purpose | Exposure | Source |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `<production-supabase-project-url>` | Production Supabase API URL | Browser-visible public identifier | Supabase Production project API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<production-supabase-anon-key>` | Publishable/anon client key; authorization depends on RLS | Browser-visible, not a server secret | Supabase Production project API settings |

Rules:

- Add both keys to Vercel **Production** with values from the Production Supabase project.
- Configure Preview separately with isolated non-production values.
- Never copy QA values into Production.
- Every `NEXT_PUBLIC_` value is embedded into browser-delivered code.
- Never add a Supabase service-role key, database password, SMTP password, historical demo password, or Auth token to a `NEXT_PUBLIC_` variable.
- Do not store any real value in this document or commit it to `.env*`.
- Redeploy after changing an environment variable; already-built deployments do not acquire a new value automatically.

Vercel documents environment-specific values and their deployment behavior in [Environment Variables](https://vercel.com/docs/environment-variables) and [Vercel Environments](https://vercel.com/docs/deployments/environments).

## 10. Deploy to Vercel Production

1. Create/link the Vercel project in the approved production team.
2. Set the framework preset to Next.js and preserve repository defaults unless a reviewed build requires otherwise.
3. Set the two Production environment variables from section 9.
4. Keep Preview connected to non-production Supabase only.
5. Deploy the exact approved commit to Preview first.
6. Verify build success, build logs, environment label, commit SHA, and preview smoke checks.
7. Confirm Production Supabase migrations, Auth, Admin bootstrap, and database checks are complete.
8. Promote/deploy the exact approved artifact to Production; do not rebuild from an unpinned branch if the artifact can be promoted.
9. Record deployment ID, immutable URL, commit SHA, operator, time, and environment.
10. Run the production verification checklist using dedicated smoke accounts.
11. Do not declare release safety until the credential gate is complete.

## 11. Cut over DNS and the custom domain

### 11.1 Before cutover

- Decide the canonical domain and whether apex or `www` redirects to it.
- Resolve the current source-code URL mismatch described in section 15 before launch.
- Lower DNS TTL in advance where the provider permits it.
- Add the domain to the Vercel project and use the exact DNS records Vercel reports; do not copy generic examples blindly.
- Add the final canonical origin to Supabase Site URL/redirect configuration.
- Confirm no Preview deployment uses production secrets beyond the explicit policy.

### 11.2 Cutover

1. Add/verify the domain in Vercel.
2. Apply the required A/CNAME/TXT records at the authoritative DNS provider.
3. Wait for Vercel verification and TLS certificate provisioning.
4. Verify HTTPS, certificate hostname/expiry, apex/`www` redirect, login callbacks, Auth email links, `robots.txt`, `sitemap.xml`, OGP assets, and 404 behavior.
5. Execute the production smoke checklist on the canonical domain.

Vercel’s current procedure explains domain inspection, provider-specific records, verification, and automatic certificate provisioning: [Set up a custom domain](https://vercel.com/docs/domains/set-up-custom-domain).

## 12. Rollback

### 12.1 Application rollback

If the application deployment is defective but the database remains compatible:

1. Stop the smoke run and announce the rollback decision.
2. Use Vercel Instant Rollback to route traffic to the last known-good deployment.
3. Verify the canonical domain, core public page, login, and one read-only role route.
4. Record the rollback deployment ID and incident timeline.
5. Keep the defective deployment and logs for investigation.

See [Vercel Instant Rollback](https://vercel.com/docs/instant-rollback).

### 12.2 Configuration rollback

- Restore the previous approved Vercel environment values from the secrets manager, then create/promote a new deployment.
- Restore Supabase Site URL/redirect/SMTP/session settings only from a recorded prior configuration.
- Reverify Auth callbacks and mail delivery.
- Never paste old secret values into incident chat or release evidence.
- Rotate any value suspected of exposure instead of merely restoring it.

### 12.3 Database recovery

Do **not** blindly reverse migrations. DDL and data transformations may be non-reversible, an older application may be incompatible with the newer schema, and destructive down scripts can amplify an incident.

Preferred order:

1. Roll the application to a schema-compatible build.
2. Contain writes if data integrity is at risk.
3. Take/confirm a backup and preserve evidence.
4. Prepare a reviewed forward-fix migration.
5. Restore from a verified backup/PITR only when the incident owner accepts downtime and the recovery-point data-loss window.

Supabase documents automatic backups, restoration downtime, logical dumps, and PITR behavior in [Database Backups](https://supabase.com/docs/guides/platform/backups).

## 13. Final Go/No-Go gate

Every item must be `GO`, have evidence, and have named approval:

| Gate | Required evidence | Result |
|---|---|---|
| Approved immutable commit | SHA and review approval | `<GO/NO-GO>` |
| Repository quality | lint, typecheck, build, diff hygiene | `<GO/NO-GO>` |
| Migrations 001–070 | ordered ledger/history and structural checks | `<GO/NO-GO>` |
| Master data | migration-derived counts; no QA rows | `<GO/NO-GO>` |
| RLS/security | catalog checks and cross-role smoke evidence | `<GO/NO-GO>` |
| Auth | URLs, email, roles, sessions, reset decision | `<GO/NO-GO>` |
| Admin invariant | counter/trigger/function evidence | `<GO/NO-GO>` |
| Opportunity integrity | two validated constraints and zero invalid counts | `<GO/NO-GO>` |
| Vercel/config | immutable deployment and production-only values | `<GO/NO-GO>` |
| DNS/TLS | canonical domain and callback evidence | `<GO/NO-GO>` |
| Legal/business content | named owner approval | `<GO/NO-GO>` |
| Contact handling | working, owned delivery path or approved removal | `<GO/NO-GO>` |
| Monitoring/rollback | owner, alerts, logs, backup/rollback drill | `<GO/NO-GO>` |
| Historical demo identities | rotate/disable, revoke, former login fails | `<GO/NO-GO>` |
| Production smoke checklist | signed overall result | `<GO/NO-GO>` |

Any `NO-GO`, blank owner, or missing evidence stops the release.

Current Phase 7 status:

> **SAFE TO RELEASE = NO**

## 14. Post-Go-Live monitoring

### 14.1 Low-cost option comparison

| Option | What it catches | Setup effort | Cost category | Day-1 recommendation |
|---|---|---|---|---|
| Vercel Runtime Logs + Observability | Next.js function/middleware errors, HTTP status, latency, traffic, build/deploy failures | Low; available in the Vercel project | Included baseline; retention/features vary by plan | **Required Day 1.** Watch 4xx/5xx, Auth callback routes, latency, and failed builds. Avoid logging PII, tokens, cookies, or passwords. |
| Supabase Logs Explorer + advisors | API, Postgres, Auth, Realtime events; slow/erroring queries; security/performance findings | Low; built into the Supabase dashboard | Included baseline; retention varies by plan | **Required Day 1.** Watch Auth failures, Postgres errors, API denials, connection/resource pressure, and advisor findings. |
| [Sentry for Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/) | Correlated client/server exceptions, stack traces, releases, affected users, and optional performance traces | Medium; requires SDK/configuration and privacy review | Free/developer entry tier, then usage-based/paid; verify current limits before enabling | **Recommended immediately after approval** if launch risk warrants application-level alerting. This is new implementation work and must not be added during this documentation-only task. |

Vercel describes real-time function and middleware logs and plan-dependent retention in [Runtime Logs](https://vercel.com/docs/logs/runtime), while [Vercel Observability](https://vercel.com/docs/observability) covers error-rate, route, traffic, and performance analysis. Supabase provides product-specific API/Postgres/Auth/Realtime logs in its [Logging guide](https://supabase.com/docs/guides/telemetry/logs).

### 14.2 Day-1 operating cadence

- Name one primary and one backup incident responder.
- For the first two hours, review Vercel 5xx/latency and Supabase Auth/API/Postgres errors continuously.
- For the first 24 hours, review at least hourly; then move to an agreed daily/alert-driven cadence.
- Track signup confirmation failures, login rejection rate, failed opportunity saves, failed application transitions, message/notification producer errors, and withdrawal failures.
- Alert on loss of the last-Admin counter consistency, unexpected RLS/security-advisor findings, database resource saturation, and backup failures.
- Keep dashboards free of secrets and minimize retained personal data.
- Record an incident severity matrix, communication channel, escalation contacts, rollback owner, and customer-notification owner.

## 15. Known decisions and documentation discrepancies

These are explicit Go-Live decisions, not permission to change code:

1. `docs/RD-2026-001.md` and `docs/DB-2026-001.md` are referenced in source comments and the Phase 7 request but are absent from the current checkout. Requirements/database traceability cannot be independently reconciled from those files.
2. The repository `README.md` advertises `https://engineer-match-henna.vercel.app`, while metadata, robots, and sitemap code use `https://engineer-match-5yvr.vercel.app`. The canonical production/custom domain must be selected and source metadata aligned in a separately approved change.
3. `src/constants/pages.ts` marks Company, Contact, Privacy, and Terms content as placeholder-only. A named legal/business owner must approve final text before release.
4. The Contact form currently acknowledges submission locally but has no verified delivery/backend path. Approve an implementation or an honest alternative before launch.
5. The login forgot-password control does not provide a complete reset flow. Decide whether to implement it or remove/disable the affordance before launch.
6. Public Instructor registration and an Instructor dashboard are not implemented. Do not market Instructor availability.
7. The repository has no Supabase CLI configuration/dependency and no standalone production seed command. The first production migration is a controlled staged/manual procedure unless a separately validated CLI workflow is approved.
8. Migration `069` requires an ACTIVE Admin and creates a bootstrap ordering constraint on a fresh project. Follow section 5.2.
9. The first-Admin bootstrap leaves an otherwise unused Company profile unless a separately reviewed cleanup step is approved.
10. Monitoring beyond provider-native logs, such as Sentry, would require separately approved code/configuration work.

## 16. Operator record

| Item | Value |
|---|---|
| Approved commit SHA | `<sha>` |
| Production Supabase project ref | `<project-ref>` |
| Migration ledger/evidence | `<location>` |
| Production Vercel deployment ID | `<deployment-id>` |
| Canonical domain | `<domain>` |
| Deployment operator | `<name>` |
| Independent verifier | `<name>` |
| Deployment time | `<timestamp-with-timezone>` |
| Rollback owner | `<name>` |
| Monitoring owner | `<name>` |
| Verification checklist | `<evidence-location>` |
| Historical credential cleanup evidence | `<evidence-location>` |
| Final decision | `SAFE TO RELEASE = NO` until all gates pass |
