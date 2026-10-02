# Petory — Code and Test Completion Plan

## Goal and Scope

Finish the application on branch `feature/connect_DB` before packaging or
deploying it. The first deliverable is a working app with complete demo content
and repeatable tests. Add editable JavaScript configuration modules modeled on
the separation in `example_code/tosh-mobile-backend/configs/config_app.py` and
`config_db.py`; these are source configuration files, not public admin web pages.
The Linux Docker/Cloudflare release is a later plan in
`petory-linux-cloudflare-release.md`.

## Implementation evidence (2026-10-02)

- Completed configuration modules, migration `007`, auth recovery, persistent
  rate limits, media ownership/cleanup, social policy, and ten distinct licensed
  Recipe/Clinic demo photos. Next.js and eslint-config-next are both `16.3.8`.
- Clean `npm ci`, lint, 22 unit tests, production build, migration rerun,
  PostgreSQL/API/browser integration, and `npm audit --omit=dev` passed locally.
  Browser screenshots are in ignored `petory/test-results/`; the root GitHub
  Actions workflow will provide independent evidence after a push/PR.
- The disposable test database was reseeded to 8 demo accounts, 8 pets, and
  34 posts after integration. No public deployment or real Resend delivery was
  attempted; those belong to the Linux/Cloudflare release plan.

## Starting baseline before implementation (2026-10-02)

- `petory/src/features/posts/schema.js` defaults `photoMediaId` to `null`, while
  `petory/src/features/posts/schema.test.js` expects the older object shape.
  The preceding run failed this one test; dependencies were missing at the
  start and were restored with `npm ci` before implementation.
- `petory/scripts/seed.mjs` defines six recipe posts and four clinic posts, but
  inserts them without `photo_media_id`. `petory/src/app/petory/helpers.jsx`
  falls back to one of five shared pet images for posts. This violates the
  request that every card in the two Explore tabs use a distinct image.
- `petory/src/server/posts/repository.js` filters Explore by category and pet
  species. The seed sets `pet_id` only on story posts, so selecting a species
  empties non-story categories even when demo posts exist.
- `petory/src/app/petory/forgot/page.jsx` has an uncontrolled email input and
  `sendResetLink` in `petory/src/app/petory/context.jsx` only shows a toast.
- `petory/src/app/api/media/[mediaId]/route.js` permits any signed-in account
  to read any media ID. `petory/src/app/api/media/route.js` creates unattached
  media before the pet/post exists; ownership and orphan handling need tests.
- Current tests cover seven schema/security files. There are no PostgreSQL API
  integration tests or browser E2E tests for the new DB-backed features.
- The reference backend separates app settings (`config_app.py`) from database
  settings (`config_db.py`). Petory already validates basic environment values
  in `petory/src/shared/config/env-schema.js`, but `petory/src/server/db/pool.js`
  hard-codes pool/timeouts, `petory/src/server/media/service.js` hard-codes the
  2 MB upload limit, and `petory/src/server/auth/session.js` hard-codes the
  15-day session lifetime. Migration and seed scripts currently read DB env
  independently. The reference DB file contains credential defaults, which
  must **not** be copied into Petory.

## Acceptance Criteria

1. Fresh `npm ci`, `npm run lint`, `npm run test`, and `npm run build` all pass.
2. Two JavaScript modules, `petory/src/server/config/config.app.js` and
   `petory/src/server/config/config.db.js`, become the documented server-side
   entry points for app policy and DB connection/pool settings. Existing env
   schema is reused, not duplicated. Safe defaults live in code; URL,
   passwords, signing keys, and mail credentials come only from env/secrets.
   Missing/invalid production secrets fail validation before use, and neither
   module is imported into client bundles. `next.config.mjs` and CLI scripts
   retain a compatible env-loading path without a circular import.
3. Changing one documented non-secret setting (for example upload size, session
   lifetime, or DB pool max) changes the corresponding server behavior without
   editing route handlers. Env overrides are validated with clear error names;
   a malformed URL, zero/negative limit, or invalid SSL mode fails predictably.
   Configuration unit tests and one DB connection smoke test pass.
4. With a fresh development DB migrated through `007` and seeded, each of the
   Recipe and Clinic tabs returns posts through `GET /api/posts?scope=explore`
   with its category filter. The tabs never show the empty state while these
   rows exist. Applying Dog/Cat filters returns the intended demo rows rather
   than becoming empty because `pet_id` is missing.
5. The six recipe cards and four clinic cards each show a relevant local image.
   Across those ten cards, no image file or SHA-256 checksum repeats. All photo
   pages and licenses are recorded in `public/uploads/demo/ATTRIBUTION.md`.
6. A member cannot attach another account's media ID to their pet/post or read
   a private image through `/api/media/:mediaId`; unauthorized access returns
   403 or 404. Valid owner upload/read continues to work.
7. Password reset uses expiring, single-use hashed tokens, ends old sessions
   after a successful reset, and returns the same public response for known and
   unknown email addresses. Repeated auth/reset/upload calls hit a tested 429
   limit. Real email credentials are supplied later by the deployment owner.
8. E2E proves: register/login -> pet with photo -> post with photo -> Explore
   filters -> follow/block -> match/chat; admin report -> suspend -> denied
   login -> unsuspend. Tests use a disposable DB and do not mutate user data.

## Work Sequence

### 1. Restore a green baseline

1. Run `npm ci` in `petory/` to restore locked dependencies.
2. Update `petory/src/features/posts/schema.test.js` to expect
   `photoMediaId: null`; add one case for a supplied UUID and one for an
   invalid UUID. Keep the schema behavior if its default is intentional.
3. Run `npm run lint`, `npm run test`, and `npm run build` and record any new
   failures before feature edits.
4. Apply migrations `001`–`007` in a disposable PostgreSQL database; verify
   migration rerun is harmless. Do not overwrite the developer's existing DB.

**Done when:** current tests and build pass and the DB schema is reproducible.

### 2. Centralize editable app and DB configuration

1. Preserve the current validation boundary in
   `petory/src/shared/config/env-schema.js` and `env.js`. Add
   `petory/src/server/config/config.app.js` for server-side app behavior:
   public base URL/origin policy, session lifetime, upload size and MIME
   allowlist, reset-token expiry, rate-limit thresholds, and mail provider
   selection when those features are implemented. Only values with real
   operational use should be introduced; no speculative toggle catalog.
2. Add `petory/src/server/config/config.db.js` for `DATABASE_URL`, SSL policy,
   pool max, idle/connection timeouts, and optional application name. Use
   validated values; never commit DB username/password or a production URL as
   defaults. Refactor `petory/src/server/db/pool.js` to consume it. Ensure
   `scripts/migrate.mjs`, `scripts/seed.mjs`, and
   `scripts/promote-admin.mjs` use the same DB settings via a CLI-safe shared
   parser after `@next/env` loads env files, without importing `server-only`
   modules into Node scripts.
3. Replace the existing literals in `petory/src/server/media/service.js` and
   `petory/src/server/auth/session.js` only after behavior is locked by tests.
   Wire future password-reset and rate-limit services to `config.app.js`, not
   scattered `process.env` reads. Keep browser-visible values in a separate
   explicit public contract; no DB/mail/session secrets or full server config
   may cross into React client code.
4. Update `petory/.env.example`, `.env.production.example`, and `README.md`
   with a small grouped settings table: purpose, safe default, override name,
   development vs production requirement, and restart/build requirement.
   `.env.local`/`.env.production` remain untracked; Docker production compose
   supplies secrets at runtime. Provide sample values, not real credentials.
5. Add unit tests for defaults, overrides, invalid ranges/URLs/booleans,
   absent production secrets, and client/server import boundaries. Run a
   disposable-Postgres connection/migration smoke test using the configured
   DB settings; verify changing a pool or upload limit actually affects the
   consumer, not just the parsed object.

**Done when:** the two files are the single documented places to edit safe app
and DB defaults, env/secrets override sensitive deployment values, scripts and
runtime agree on DB settings, and configuration tests pass without exposing
secrets to client code or logs.

### 3. Finish the two Explore tabs and unique demo photos

1. Verify DB counts for `recipe` and `clinic`, then call the category API while
   logged in. Use the result to distinguish stale local seed data, incorrect
   query/filter behavior, or client rendering state in
   `petory/src/app/petory/explore/page.jsx`.
2. Add ten individually sourced free-to-use assets under
   `petory/public/uploads/demo/`: six food/recipe images and four clinic/care
   images. Keep them small enough for the existing 2 MB `media_files` limit;
   record original source and photographer in `ATTRIBUTION.md`.
3. Give every recipe/clinic seed post its own file and store it as
   `photo_media_id` in `petory/scripts/seed.mjs`. Associate the demo post with
   its author's pet when a Dog/Cat species filter is meant to match. Avoid
   merely changing the visual fallback; the API should return the media ID.
4. Keep `petory/src/app/petory/helpers.jsx` fallback only for genuinely
   unpictured user posts. The recipe/clinic demo should never use it.
5. Add a seed validation test/query for counts, category mapping, image MIME,
   file size, and ten unique SHA-256 values. Test category plus species filters
   and verify both tabs by browser screenshot.

**Done when:** the two tabs display the expected cards with distinct relevant
photos, including after refresh and after rerunning the development seed.

### 4. Fix ownership and state consistency for media/social flows

1. In `petory/src/server/posts/repository.js` and the pet repository, validate
   that supplied `photoMediaId` belongs to the current account before attach
   or replace. Use one transaction for ownership check and assignment where
   race conditions could create a dangling relationship.
2. In `petory/src/app/api/media/[mediaId]/route.js`, apply the resource's
   visibility/block policy; document which avatar, pet, and post images are
   community-visible and which unattached images remain owner-only.
3. Define deletion/replacement behavior so old images are deleted or marked
   orphaned only when no resource references them. Bound per-account media
   storage and clean up abandoned uploads safely.
4. Add PostgreSQL integration tests with two accounts for upload, attach,
   replace, read, block, delete, oversized file, and invalid MIME/signature.
5. Test that Follow, Matching, Chat, Notifications, and Admin see the same DB
   state after refresh, including suspension ending existing sessions.

**Done when:** cross-account media access is denied and all user-facing state
survives logout/login or page refresh.

### 5. Complete account recovery and abuse limits

1. Implement forgot/reset API routes around the existing
   `password_reset_tokens` table in migration `001_initial_schema.sql`.
2. Wire the input in `petory/src/app/petory/forgot/page.jsx` to the API; add a
   token-backed reset page with pending/error/success states.
3. Use a fake/memory mail sender in tests and a configurable provider adapter
   for real deployment. Never place provider keys or reset tokens in client
   bundles or logs.
4. Add server-enforced rate limits for login, register, reset, media upload,
   and report endpoints. Test boundaries and retry behavior.

**Done when:** token expiry, single use, old-session revocation, neutral email
response, and 429 limits are covered by automated tests.

### 6. Regression suite and release gate

1. Add API integration tests against a disposable PostgreSQL database for the
   new routes and admin moderation transactions. Update CI in the repository
   root `.github/workflows/verify.yml` to run them after migrations.
2. Add browser E2E for the two acceptance journeys above. Keep seeded demo
   accounts out of production; use them only in disposable test/dev DBs.
3. Patch `next` and `eslint-config-next` together to a compatible version at
   least `16.3.6` before public release, update the lockfile, and rerun
   `npm audit --omit=dev` plus the complete quality gate. This is a patch
   update, not a move to an unrelated major version.
4. Review the final diff for accidental secret files, stale mock data shown
   to authenticated users, and unsupported UI controls that still only show a
   toast.

**Done when:** CI is green, E2E passes on a clean database, and the remaining
deployment work is only the Linux/Cloudflare plan.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Reseeding removes demo accounts and their data | Run on a disposable DB; never run `db:seed` on production. |
| Image duplicates hidden by renaming files | Compare SHA-256, not just filenames, for the ten requested cards. |
| Recipe/Clinic still empty with Dog/Cat filter | Attach relevant pet IDs or explicitly define/filter species independently; test both API and browser. |
| New routes pass schema tests but fail against Postgres | Run two-account integration tests against a migrated disposable DB. |
| Real email provider is not yet selected | Finish provider-neutral code/tests now; obtain deployment credentials before public release. |
| Config files become a second source of truth beside env or diverge between app and scripts | Reuse one parser/schema, test runtime and CLI consumers, and document precedence: code defaults -> environment override -> validation. |
| A copied example default leaks DB credentials or a server config import reaches the browser | Do not copy credentials from the reference; keep config modules server-only, retain ignored env files, and test import boundaries/secret scanning. |
| Changing a server setting requires an image rebuild or restart unexpectedly | Document which settings are build-time/public versus runtime/server-side and verify the Docker startup path before release. |

## Stop Point

This plan ends when application behavior and tests are verified. Packaging the
ZIP, Linux Docker composition, certificates, DNS, and Cloudflare remain in the
separate deployment plan.
