# ENGINEER MATCH Production Verification Checklist

## Table of contents

1. [Rules and test evidence](#1-rules-and-test-evidence)
2. [Mandatory release-security gate](#2-mandatory-release-security-gate)
3. [Pre-smoke readiness](#3-pre-smoke-readiness)
4. [Public and unauthenticated](#4-public-and-unauthenticated)
5. [Engineer](#5-engineer)
6. [Company](#6-company)
7. [Admin](#7-admin)
8. [Cross-role security](#8-cross-role-security)
9. [Notifications](#9-notifications)
10. [Reviews](#10-reviews)
11. [Responsive, mobile, and browser](#11-responsive-mobile-and-browser)
12. [Legal pages and company information](#12-legal-pages-and-company-information)
13. [Metadata and social sharing](#13-metadata-and-social-sharing)
14. [404 and error handling](#14-404-and-error-handling)
15. [Post-smoke data hygiene](#15-post-smoke-data-hygiene)
16. [Final Go-Live sign-off](#16-final-go-live-sign-off)

## 1. Rules and test evidence

Use this checklist only after the exact production deployment, Supabase project, canonical domain, and migration state are recorded.

### Safety rules

- [ ] Use dedicated Production smoke-test accounts for Engineer, Company, and additional Admin testing.
- [ ] Use clearly prefixed synthetic data, for example `[PROD-SMOKE <date>]`.
- [ ] Never perform destructive tests with a real customer, real business, or primary Production Admin account.
- [ ] Never expose passwords, tokens, cookies, session values, private keys, or secret environment values in evidence.
- [ ] Never import QA/shared data, demo data, or Phase 6 QA-only skills.
- [ ] Use the smallest data set needed and record every created row for cleanup.
- [ ] Confirm the withdrawal accounts are disposable before starting.
- [ ] Stop on any suspected cross-account data exposure or integrity violation.

### Test record

| Field | Value |
|---|---|
| Commit SHA | `<sha>` |
| Vercel deployment ID | `<deployment-id>` |
| Canonical origin | `<https-origin>` |
| Supabase project ref | `<project-ref>` |
| Migration range | `001–070` |
| Browser/device matrix | `<matrix>` |
| Smoke-data prefix | `<prefix>` |
| Test start/end | `<timestamps-with-timezone>` |
| Primary tester | `<name>` |
| Independent verifier | `<name>` |

For each item, attach sanitized evidence such as timestamp, route, synthetic record ID, expected/actual result, or provider log reference. Do not attach credentials.

## 2. Mandatory release-security gate

The following historically exposed demo identities are retained **only** for final testing:

- `demo-engineer@engineer-match.jp`
- `demo-company@engineer-match.jp`
- `admin@example.com`

Do not include their passwords in this checklist or evidence.

Before `SAFE TO RELEASE` can become `YES`:

- [ ] Rotate credentials **or** disable/delete all three accounts.
- [ ] Revoke existing sessions for all three accounts.
- [ ] Verify the former credentials can no longer authenticate.
- [ ] Record sanitized evidence and the authorized operator.

Until every box is checked:

> **SAFE TO RELEASE = NO**

## 3. Pre-smoke readiness

- [ ] The tested commit and immutable deployment ID match release approval.
- [ ] Production uses `NEXT_PUBLIC_SUPABASE_URL` from the Production project.
- [ ] Production uses `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Production project.
- [ ] No service-role key or secret is browser-exposed.
- [ ] Migrations `001`–`070` are recorded as successfully applied; no `071` exists.
- [ ] `chk_opportunities_description_length` is validated.
- [ ] `chk_opportunity_hourly_work_style_required` is validated.
- [ ] Migration `069` Admin invariant state, trigger, and function checks pass.
- [ ] Required master-data tables contain only migration-approved production rows.
- [ ] Phase 6 QA-only skills are absent.
- [ ] Provider logs are open and assigned to a monitor.
- [ ] A known-good Vercel rollback target and rollback owner are recorded.
- [ ] Smoke Engineer, Company, and safe secondary Admin identities are confirmed.

## 4. Public and unauthenticated

### Homepage and navigation

- [ ] `/` loads over HTTPS without console errors, broken assets, or mixed content.
- [ ] Homepage DB-backed counts load from Production and agree with read-only Production aggregates.
- [ ] Header/footer navigation reaches `/company`, `/contact`, `/privacy`, and `/terms`.
- [ ] Login and signup calls to action use the canonical origin.

### Engineer registration

- [ ] `/signup` allows a new dedicated Engineer smoke identity.
- [ ] Required fields reject empty/invalid input without losing safe form state.
- [ ] Email confirmation behavior matches the approved Auth configuration.
- [ ] Confirmed Engineer login reaches `/engineer/dashboard`.
- [ ] Duplicate/invalid registration produces a generic safe error.

### Company registration

- [ ] `/signup` allows a new dedicated Company smoke identity.
- [ ] Required fields reject empty/invalid input.
- [ ] Email confirmation behavior matches the approved Auth configuration.
- [ ] Confirmed Company login reaches `/company/dashboard`.
- [ ] Duplicate/invalid registration produces a generic safe error.

### Login, logout, and guards

- [ ] Valid Engineer login routes to the Engineer dashboard.
- [ ] Valid Company login routes to the Company dashboard.
- [ ] Valid Admin login routes to the Admin dashboard.
- [ ] Invalid email/password returns a generic rejection without account enumeration.
- [ ] Logout removes application access and protected routes redirect to `/login`.
- [ ] Unauthenticated requests to Engineer, Company, shared messages/notifications, and Admin protected routes redirect safely.
- [ ] The login hero raw asset and optimized `/_next/image` response both return HTTP 200.
- [ ] The forgot-password control behaves exactly as the approved launch decision describes; do not claim a reset email was sent unless the complete flow exists.

## 5. Engineer

### Dashboard and profile

- [ ] `/engineer/dashboard` loads Production-backed summary data.
- [ ] `/engineer/profile` loads only the signed-in Engineer’s private data and allowed public/review data.
- [ ] Profile edit/save persists valid changes after refresh and a new session.
- [ ] Required profile fields reject blank/invalid values.
- [ ] Work style and preferred conditions persist accurately.
- [ ] Adding skills works from 1 through 20.
- [ ] Attempting a 21st skill is rejected/blocked without corrupting existing skills.
- [ ] Skill removal and experience-year changes persist.
- [ ] Qualification, work experience, education, language, portfolio, contact, and personal-information changes remain scoped to this Engineer.
- [ ] Review visibility toggle changes public Company visibility but does not hide reviews from the reviewed Engineer.

### Opportunity search

- [ ] `/engineer/jobs` shows only eligible published opportunities.
- [ ] Keyword search matches both `title` and `description`.
- [ ] A two-skill filter uses AND semantics: every result has both required skills.
- [ ] Work-style filter correctly handles Remote, On-site, and Hybrid for supported opportunity subtypes.
- [ ] Newest/default ordering is by `updated_at`, with stable ID tie-breaking.
- [ ] Oldest ordering reverses `updated_at` as expected.
- [ ] Pagination displays 20 items per full page.
- [ ] Page boundaries contain no duplicate or skipped IDs for an unchanged data set.
- [ ] Empty and invalid filters fail safely.

### Favorites and applications

- [ ] Add a published opportunity to favorites; it appears after refresh.
- [ ] Remove the favorite; only the signed-in Engineer’s row is affected.
- [ ] Submit a valid application once.
- [ ] A duplicate or ineligible application is rejected.
- [ ] Application history displays the correct opportunity and current status.
- [ ] Allowed Engineer withdrawal from an eligible application succeeds.
- [ ] Withdrawal from accepted/completed or otherwise restricted state is rejected.
- [ ] Company status changes appear in Engineer history after refresh.

### Chat and notifications

- [ ] Open the eligible application conversation.
- [ ] Send a synthetic message; it persists and appears to the correct Company.
- [ ] An unrelated Engineer cannot read or write the conversation.
- [ ] Engineer notifications behave as specified in section 9.

### Password and account withdrawal

- [ ] Correct current-password reauthentication allows a valid password change.
- [ ] Wrong current password is rejected and the password remains unchanged.
- [ ] New password works after sign-out; superseded password behavior matches session policy.
- [ ] Withdraw only a disposable Production Engineer smoke account.
- [ ] Withdrawal changes status to `WITHDRAWN`.
- [ ] The withdrawn identity receives generic login/access rejection.
- [ ] Related applications, messages, reviews, and other required historical rows remain preserved.

## 6. Company

### Dashboard and profile

- [ ] `/company/dashboard` loads only the signed-in Company’s aggregates.
- [ ] Company profile edit/save persists after refresh and a new session.
- [ ] Canonical industry selection uses `industry_categories` master data.
- [ ] An inactive industry is not offered for new selection but remains interpretable where historical display requires it.
- [ ] Valid established year is accepted.
- [ ] Future/out-of-range/invalid established year is rejected.

### Opportunity creation and validation

- [ ] Create a draft Employment opportunity with its Employment-specific fields.
- [ ] Create a draft Project opportunity with its Project-specific fields.
- [ ] Create a draft Hourly opportunity with its Hourly-specific fields and required `work_style`.
- [ ] Required skills support 1 through 20.
- [ ] Zero required skills cannot publish.
- [ ] A 21st required skill is rejected/blocked.
- [ ] Description length up to 3000 characters is accepted; over 3000 is rejected.
- [ ] Project deadline today or later is accepted.
- [ ] Project deadline before today is rejected.
- [ ] Opportunity publish is blocked until the Company profile has a nonblank company name.
- [ ] Publishing creates exactly one matching subtype row and no unrelated subtype row.
- [ ] Published Hourly opportunity always has non-null work style.

### Lifecycle and applicants

- [ ] Edit a draft and confirm valid changes persist.
- [ ] Publish each supported type and verify it appears in Engineer search/detail.
- [ ] Close an eligible published opportunity and verify it leaves active search.
- [ ] Company sees only applicants to its own opportunities.
- [ ] Applicant detail shows only data permitted for that application relationship.
- [ ] Execute every allowed status transition with synthetic applications.
- [ ] Invalid transition is rejected by both UI behavior and database enforcement.
- [ ] Accepted/completed restrictions prevent disallowed Engineer/Company updates.
- [ ] Completing accepted work enables the review path.
- [ ] Company chat sends/receives only within eligible conversations.
- [ ] Company notifications behave as specified in section 9.

### Password and account withdrawal

- [ ] Correct current-password reauthentication allows a valid password change.
- [ ] Wrong current password is rejected.
- [ ] A Company with a published opportunity is blocked from withdrawal.
- [ ] Close/unpublish all disposable smoke opportunities before the withdrawal test.
- [ ] Withdraw only a disposable Production Company smoke account.
- [ ] Withdrawal changes status to `WITHDRAWN` and login/access is rejected generically.
- [ ] Related historical opportunities, applications, messages, notifications, and reviews remain preserved.

## 7. Admin

Use a dedicated secondary Production smoke Admin where mutation is required. Do not risk the primary/only real Production Admin merely to test protection.

### Dashboard and management

- [ ] `/admin` dashboard aggregate cards agree with read-only Production counts.
- [ ] User list/filter/detail loads Engineer, Company, and Admin records according to Admin policy.
- [ ] Company management displays canonical profile and industry data.
- [ ] Opportunity management displays subtype, status, owner, and integrity-relevant fields.
- [ ] Application management displays correct parties and status.
- [ ] Message management exposes only the intended Admin moderation view.
- [ ] Reports management loads and updates only through allowed Admin actions.
- [ ] Reviews management loads review/reply content and moderation controls as implemented.
- [ ] Master-data pages display skill, qualification, level, assessment, and industry domains.
- [ ] Industry-category management preserves canonical IDs/references.
- [ ] Inactive master rows are excluded from new selections while remaining safe for historical references.

### Admin protection

- [ ] Takedown/unpublish requires and records the expected reason.
- [ ] Admin audit actions are written through `admin_write_audit_log`.
- [ ] Self-suspension protection rejects unsafe self-demotion/suspension.
- [ ] Last-active-Admin protection is confirmed by read-only inspection of the migration `069` counter, enabled trigger, trigger events, and fixed-search-path function.
- [ ] If a behavioral last-Admin test is required, use at least two disposable Admin identities and an approved recovery operator.
- [ ] The primary Production Admin is never suspended, deleted, or demoted for smoke testing.

## 8. Cross-role security

### Route and role isolation

- [ ] Engineer cannot access Company or Admin protected routes.
- [ ] Company cannot access Engineer or Admin protected routes.
- [ ] Admin routing does not accidentally grant Engineer/Company UI sessions.
- [ ] Unauthenticated access to every protected route redirects safely.
- [ ] Shared `/messages` and `/notifications` routes resolve only for the correct signed-in role.

### Account status

- [ ] A disposable `SUSPENDED` identity receives generic login/access rejection.
- [ ] A disposable `WITHDRAWN` identity receives generic login/access rejection.
- [ ] Rejection does not reveal role, status, or account existence.
- [ ] An ACTIVE account continues to work after the rejected tests.

### RLS isolation

- [ ] Engineer A cannot read/update Engineer B private profile/contact/personal rows.
- [ ] Engineer A cannot read/update Engineer B favorites, applications, assessment answers, or notifications.
- [ ] Company A cannot read/update Company B profile, opportunities, applicants, chats, or notifications.
- [ ] Company cannot see an Engineer’s applicant-only details without a qualifying application relationship.
- [ ] Conversation participants cannot access unrelated conversations/messages.
- [ ] Direct client/API attempts return no unauthorized rows or a safe denial.
- [ ] No RLS test uses a service-role key.

## 9. Notifications

Create each notification through its real business event; do not insert notification rows directly.

### Implemented producers

- [ ] `new_message`: send a message and verify the other participant receives exactly one notification.
- [ ] `review_received`: Company submits a review for a completed application; reviewed Engineer receives it.
- [ ] `review_reply_received`: Engineer replies to a review; reviewing Company receives it.
- [ ] `application_received`: Engineer applies; opportunity-owning Company receives it.
- [ ] `application_status_changed`: Company changes status; applicant Engineer receives it.
- [ ] `opportunity_closed`: Company closes an opportunity; each eligible applicant receives the expected notification without duplicates.

### Inbox behavior

- [ ] Notifications persist across refresh and a new session.
- [ ] New notification increments/appears as unread.
- [ ] Mark-one-read affects exactly one owned notification.
- [ ] Mark-all-read affects all and only the signed-in user’s unread notifications.
- [ ] Type filters return the expected subset and handle empty state.
- [ ] Destination links open the correct owned message, application, opportunity, or review context.
- [ ] An unrelated user cannot read, update, or navigate through another user’s notification.
- [ ] Replayed/idempotent business events do not create unintended duplicate notifications.

## 10. Reviews

- [ ] Only the Company that owns a completed application can create its review.
- [ ] Review rating accepts 1–5 and rejects values outside the range.
- [ ] Review comment accepts 1–2000 characters and rejects blank/over-limit input.
- [ ] A second review for the same application is rejected.
- [ ] The authoring Company can view and edit only permitted review fields.
- [ ] The reviewed Engineer can view the review regardless of public visibility.
- [ ] Engineer reply accepts the implemented limit and preserves Company-authored fields.
- [ ] Company receives the review-reply notification.
- [ ] Public/Company Engineer visibility follows the Engineer’s global `show_reviews` setting.
- [ ] An inactive/non-eligible Engineer is not exposed through public review visibility.
- [ ] Unrelated users cannot modify the review or reply.
- [ ] Admin review view/moderation behaves as implemented and records required audit evidence.

## 11. Responsive, mobile, and browser

Test at minimum one current Chromium browser, Safari/WebKit (desktop or iOS), and Firefox, subject to the approved support matrix.

- [ ] Public home, login, signup, legal, and contact pages at mobile and desktop widths.
- [ ] Engineer dashboard, profile forms, job list/detail, applications, chat, notifications, and settings at mobile and desktop widths.
- [ ] Company dashboard, profile, opportunity form/list/detail, applicants, chat, notifications, and settings at mobile and desktop widths.
- [ ] Admin dashboard and wide data tables remain navigable at mobile/tablet/desktop widths.
- [ ] Navigation menus, dialogs, drawers, filters, pagination, and forms are keyboard usable.
- [ ] No horizontal clipping hides required actions.
- [ ] Focus indicators, labels, error messages, and touch targets remain usable.
- [ ] Login hero renders correctly without layout shift or a broken optimized image.
- [ ] Browser console has no uncaught application errors during core flows.

## 12. Legal pages and company information

The current source labels this content as placeholder-only; release requires named owner approval.

- [ ] `/company` contains approved, accurate operating-company information.
- [ ] `/contact` states an accurate contact path.
- [ ] A submitted contact request reaches an owned destination, or the approved page honestly describes the alternative.
- [ ] `/privacy` contains legally approved, production-accurate privacy terms.
- [ ] `/terms` contains legally approved, production-accurate terms.
- [ ] Company name, address, representative, contact, dates, and jurisdiction are consistent across pages.
- [ ] Footer links reach the canonical HTTPS pages.
- [ ] A named legal/business owner records approval and date.

## 13. Metadata and social sharing

Metadata is implemented in the root layout together with Open Graph/Twitter fields, `robots.ts`, and `sitemap.ts`.

- [ ] Page title and description are appropriate in rendered HTML.
- [ ] Canonical/metadata base uses the approved production origin, not an old Vercel hostname.
- [ ] Open Graph title, description, URL, and image resolve over HTTPS.
- [ ] Twitter/social card fields render and the image returns HTTP 200.
- [ ] `robots.txt` uses the approved production origin and intended crawl policy.
- [ ] `sitemap.xml` uses the approved production origin and only intended public routes.
- [ ] Preview environments are not accidentally presented as the canonical production site.

## 14. 404 and error handling

- [ ] An unknown public path renders the custom 404 experience and an appropriate HTTP status.
- [ ] Unknown protected paths do not expose data or stack traces.
- [ ] Invalid opportunity/application/message IDs fail safely for owner and non-owner.
- [ ] Database/API failure states show a usable generic message.
- [ ] Auth/session expiry redirects safely without a redirect loop.
- [ ] Error UI and provider logs contain no passwords, tokens, cookies, private keys, or excessive personal data.
- [ ] Optimized and raw image failures do not break login or primary navigation.

## 15. Post-smoke data hygiene

Create a cleanup ledger before testing. Delete only disposable smoke data that the application and approved policy permit deleting; preserve rows needed to prove withdrawal, application, chat, review, notification, or audit-history behavior.

- [ ] List every smoke identity and synthetic row ID without credentials.
- [ ] Confirm no real customer/business record was modified.
- [ ] Close/unpublish disposable smoke opportunities where required.
- [ ] Remove disposable favorites and drafts where safe.
- [ ] Keep withdrawal/history evidence without attempting destructive cascade cleanup.
- [ ] Confirm no QA/shared data or Phase 6 QA-only skills entered Production.
- [ ] Confirm all retained smoke records are clearly labeled and have an owner/retention date.
- [ ] Confirm logs/evidence contain no secrets or unnecessary personal data.
- [ ] Confirm historical demo-account cleanup remains scheduled as the final mandatory release gate.

## 16. Final Go-Live sign-off

Use `PASS`, `FAIL`, `BLOCKED`, or `N/A` with a reason. `Overall` cannot be `PASS` while any required row is `FAIL/BLOCKED` or while the historical credential gate remains incomplete.

| Area | Result | Evidence/Notes | Verified By | Date |
|---|---|---|---|---|
| Public |  |  |  |  |
| Engineer |  |  |  |  |
| Company |  |  |  |  |
| Admin |  |  |  |  |
| Auth/RLS |  |  |  |  |
| Search |  |  |  |  |
| Applications |  |  |  |  |
| Chat |  |  |  |  |
| Notifications |  |  |  |  |
| Reviews |  |  |  |  |
| Withdrawal |  |  |  |  |
| Responsive |  |  |  |  |
| Legal |  |  |  |  |
| Metadata |  |  |  |  |
| Monitoring |  |  |  |  |
| Database |  |  |  |  |
| Overall |  |  |  |  |

Final release declaration:

```text
Technical verification result: <PASS/FAIL/BLOCKED>
Historical demo credentials rotated or accounts disabled/deleted: <YES/NO>
Historical demo sessions revoked: <YES/NO>
Former credentials verified unable to authenticate: <YES/NO>
SAFE TO RELEASE: NO
```

Change `SAFE TO RELEASE` to `YES` only after every required technical/business gate passes and the three mandatory historical-identity checks are all `YES`.
