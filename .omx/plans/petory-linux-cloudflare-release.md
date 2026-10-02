# Petory — Linux Docker + Cloudflare Release Plan

**Execution order:** finish and verify `petory-code-test-completion.md` first.
The application behavior, demo content, app/DB configuration, security fixes,
and tests in that plan are prerequisites for the deployment work below.

## Goal

Deploy Petory for real public use on the instructor-provided Linux host. The
host runs the application and PostgreSQL in Docker; Cloudflare sits in front of
the host for the public domain, TLS, DNS, and edge protection. Cloudflare
Workers is explicitly out of scope.

## Current Baseline

- Application source: `petory/`, current branch `feature/connect_DB`.
- Container build already exists: `petory/Dockerfile`.
- PostgreSQL production compose exists: `petory/docker-compose.production.yml`.
- CI runs migration, lint, test, build, and integration: `.github/workflows/verify.yml`.
- Database schema currently ends at migrations `001`–`007` under
  `petory/db/migrations/`.
- A post-schema test currently fails because `postInputSchema` adds
  `photoMediaId: null` but `petory/src/features/posts/schema.test.js` expects
  the pre-photo object.
- Password reset is still UI-only at `petory/src/app/petory/forgot/page.jsx`.
- `petory/.dockerignore` does not exist. The current `petory/Dockerfile`
  contains `COPY . .`, so local environment files can enter the build context.

## Inputs Needed Before the Final Public Deployment

- Instructor host: Linux distribution/CPU, Docker Compose availability,
  ability to publish ports 80/443, public IP or an approved tunnel, and SSH
  access.
- Public domain/subdomain and permission to manage its Cloudflare DNS/SSL
  settings.
- Real outbound email account/provider for reset links and an off-host
  location for encrypted database backups.

The code, image build, and Linux smoke test can be prepared before these
credentials and infrastructure values are known.

## Deployment Topology

```text
Browser
  -> Cloudflare (DNS, TLS, WAF, rate limiting, static cache)
  -> Linux server :443
  -> Caddy reverse proxy container
  -> Petory Next.js container :3000
  -> PostgreSQL/PostGIS container :5432 (private Docker network only)
```

## Acceptance Criteria

1. A clean Linux machine can start the complete stack from the submitted ZIP
   with documented commands and no source edits.
2. `npm run lint`, `npm run test`, and `npm run build` pass on the release
   branch; the GitHub workflow is green.
3. All migrations `001`–`007` run exactly once before the app accepts traffic.
4. PostgreSQL is not exposed on a host port; only Caddy exposes ports 80/443.
   Neither `.env.local` nor `.env.production` is present in the image layers.
5. A public `https://<domain>` supports registration, login, profile/pet/post
   image upload, follow/block, matching, chat, notification, and admin flows.
6. Cloudflare is in Full (strict) mode; dynamic API and authenticated pages are
   never edge-cached.
7. Backup and restore of the PostgreSQL volume are documented and successfully
   rehearsed once against a non-production database.
8. Reset-password and mutation endpoints enforce server-side rate limits before
   public launch, with 429 responses verified by tests.
9. The submitted ZIP includes source, static assets, migrations, lockfile,
   Compose/Caddy configuration, and a runbook, but excludes local dependencies,
   build output, secrets, certificates, database dumps, and uploaded user data.

## Implementation Plan

### Phase 1 — Stabilize the release branch

1. Update the post schema assertion in
   `petory/src/features/posts/schema.test.js` so its expected object includes
   `photoMediaId: null`; retain a separate test for a supplied UUID.
2. Keep the tested `next` and `eslint-config-next` `16.3.8` patch pair or move
   both together to a newer security-supported compatible release,
   refresh `package-lock.json`, and rerun `npm audit --omit=dev`.
3. Run and capture results for `npm ci`, `npm run lint`, `npm run test`, and
   `npm run build` from `petory/`.
4. Apply migrations to a disposable local database, run `npm run db:seed`, and
   smoke test the current DB-backed UI plus the Admin path. Create the admin
   only through `petory/scripts/promote-admin.mjs`, never through browser
   client code.

**Exit check:** all quality commands are green and no uncommitted production
secrets exist.

### Phase 2 — Complete public-account protections

1. Implement a server-side forgot-password request route, a single-use hashed
   reset token with expiry using the existing `password_reset_tokens` table in
   `petory/db/migrations/001_initial_schema.sql`, and a reset-password route.
2. Replace the passive form in `petory/src/app/petory/forgot/page.jsx` with
   client calls that always return a neutral success message (do not reveal
   whether an email exists).
3. Choose and configure the actual outbound email provider in deployment
   secrets; use a development-safe mail capture/logging provider locally.
4. Add IP/account-aware rate limits for register, login, reset request, reset
   confirmation, and image uploads. Put the policy in server-side code rather
   than the React UI.
5. Tighten `petory/src/app/api/media/[mediaId]/route.js`: authorize reads based
   on owner/resource visibility, not merely any valid session. Add deletion and
   orphan-media cleanup for abandoned uploads from `petory/src/app/api/media/route.js`.

**Exit check:** reset links are single use and expire; a non-owner cannot fetch
private media by guessing a UUID; abusive repeat requests receive 429.

### Phase 3 — Add reproducible container orchestration

1. Add `petory/.dockerignore` before another Docker build. Exclude `.env*`
   except example templates, `node_modules`, `.next`, Git internals, dumps,
   certificates, and local caches. Inspect the final build context/image for
   secrets.
2. Extend `petory/Dockerfile` with a one-shot migration target that contains
   the migration scripts and dependencies, separate from the small standalone
   web runtime image.
3. Replace/extend `petory/docker-compose.production.yml` with four roles:
   `database`, one-shot `migrate`, `app`, and `caddy`.
   - `database` uses a named persistent volume and no host `ports` entry.
   - `migrate` waits for database health, runs `npm run db:migrate`, and exits
     successfully; `app` waits for migration completion.
   - `app` is private on the compose network and has no host-published port.
   - `caddy` is the only service publishing `80:80` and `443:443`.
4. Add a repo-safe `Caddyfile` that proxies to `app:3000`, sets sensible
   request-size limits for the 2 MB media policy, preserves client IP headers,
   and has an HTTP health route.
5. Update `petory/.env.production.example` with every non-secret setting and a clear
   placeholder for secrets. Keep `.env.production` ignored. Required values:
   domain, public app URL, allowed origins, database credentials, session
   secret, mail provider credentials, and Cloudflare-origin certificate paths
   if that certificate option is used.
6. Add documented container health checks for database, app `/api/health`, and
   Caddy. Configure restart policies only for long-running services, not the
   migration job.

**Exit check:** `docker compose ... up -d --build` can be rerun without lost
data, migration failure prevents app startup, and only 80/443 are reachable on
the host.

### Phase 4 — Test the Linux artifact before public DNS

1. Use the same ZIP extraction procedure intended for the instructor host on a
   clean Linux AMD64 VM. Build on Linux so Docker naturally emits AMD64 images;
   Mac ARM emulation is development-only and not the production artifact.
2. Create `.env.production` manually from `.env.production.example` using
   unique secrets. Do not put it into the ZIP or Git history.
3. Execute the documented deploy command and confirm containers and logs are
   healthy. The migration job runs automatically. Do not seed public production
   with `@petory.local` demo accounts; use a separate disposable test DB for
   seed and full-flow E2E checks.
4. Run browser E2E flows: register -> login -> avatar -> pet photo -> post
   photo -> follow/block -> match -> message -> report -> admin suspend ->
   denied login -> unsuspend.
5. Add integration tests against PostgreSQL for media authorization,
   moderation/suspension, reset tokens, and migration ordering. Add browser E2E
   tests (Playwright or equivalent) for the public flows above.

**Exit check:** all workflows pass on Linux, no DB port is public, and the app
can be restored from a fresh deployment plus backup.

### Phase 5 — Connect the public domain through Cloudflare

1. Confirm the instructor's network permits public inbound 80/443. If it does
   not, agree on an approved Cloudflare Tunnel deployment before DNS changes.
   Obtain the domain/subdomain and the server's public IP when available. Add the domain
   to Cloudflare and create an `A`/`AAAA` record pointing to the host with the
   proxy enabled.
2. Install a Cloudflare Origin Certificate (or a publicly trusted certificate)
   in a root-readable deployment directory outside the submitted source tree;
   mount it read-only into Caddy. Set Cloudflare SSL/TLS to **Full (strict)**.
3. On the Linux firewall, permit only SSH administration plus inbound 80/443;
   restrict origin web traffic to Cloudflare IP ranges when operationally
   possible. Never expose PostgreSQL.
4. Configure Cloudflare cache rules: cache hashed static Next assets; bypass
   cache for `/api/*`, `/petory/*`, session-bearing paths, and media URLs unless
   their authorization model is explicitly safe for caching.
5. Configure WAF/rate-limit rules consistent with server limits for login,
   register, reset, reports, and media uploads. Test Cloudflare proxy headers,
   cookie `Secure` behavior, same-origin checks, webhooks/email links, and API
   error responses on `https://<domain>`.

**Exit check:** public HTTPS uses the intended domain, no mixed content or
redirect loops occur, and the direct origin IP does not serve protected traffic
outside the approved path.

### Phase 6 — Operate and hand off

1. Create `petory/DEPLOYMENT.md` with: Linux prerequisites, ZIP extraction path,
   first deploy, update deploy, logs, restart, rollback, admin promotion, and
   emergency disable instructions.
2. Add `petory/BACKUP.md` with an automated `pg_dump` command, retention period,
   encrypted off-host destination, and a restore drill command into a separate
   database.
3. Add lightweight monitoring: external HTTPS uptime check, disk usage alert,
   database volume growth, container restart alert, and application error log
   retention.
4. Produce the submission ZIP from `petory/` after the release is verified.
   Check its file listing, extract it into a clean directory, and run the
   documented commands there. Never rely on the developer's `node_modules`,
   local database volume, or `.next` output.
5. Record final environment values privately: domain, server IP/SSH owner,
   Cloudflare zone owner, backup owner, and recovery contact. Do not commit the
   record to the repository.

**Exit check:** another team member can deploy, observe, back up, restore, and
roll back using the written runbook alone.

## Release Order

1. Phase 1: repair tests, choose a patched Next release, establish a green build.
2. Phases 2 and 3: finish account/media safeguards and reproducible Docker.
3. Phase 4: prove the extracted ZIP and full flows on clean Linux.
4. Phase 5: connect Cloudflare only after the Linux origin passes smoke tests.
5. Phase 6: rehearse backup/restore and hand over the runbook/ZIP before
   declaring the service ready for public use.

## Risks and Controls

| Risk | Control |
| --- | --- |
| ARM Mac image fails on AMD64 Linux | Build on the Linux host, or use `docker buildx --platform linux/amd64` for prebuilt images. |
| Schema mismatch at boot | Mandatory one-shot `migrate` service before `app`; never run manual SQL on the live host. |
| Database leak | No PostgreSQL host port, private compose network, firewall rules, encrypted backups. |
| Cloudflare redirect/TLS loop | Use one origin TLS configuration and Full (strict), then validate `https://domain` before enabling cache rules. |
| Login/email abuse | Server and Cloudflare rate limits plus neutral reset responses. |
| Images expose private data | Resource-level media authorization tests before cache/CDN enablement. |
| Instructor host is unreachable or changed | First prove the same ZIP on a disposable Linux AMD64 VM and document exact commands. |
| ZIP omits an asset or includes secrets | Inspect the archive manifest and extract/run it in a clean directory before delivery. |

## Stop Conditions

- Do not point public DNS at the server while lint/test/build or Docker health
  checks are failing.
- Do not enable Cloudflare cache rules for authenticated/API routes.
- Do not include `.env.production`, certificate private keys, database dumps,
  or production image uploads in Git or the submission ZIP.
