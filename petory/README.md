# Petory

Petory is a Next.js and PostgreSQL application for a pet-owner community.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
cp .env.example .env.local
docker compose up -d
npm ci
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The application begins at
`/petory/login`.

`DATABASE_URL` and `SESSION_SECRET` are server-only values. Never commit
`.env.local` or a real secret.

### Configuration

Edit safe defaults in `src/server/config/config.app.js` (app behavior) and
`src/server/config/config.db.js` (PostgreSQL pool). Override deploy-specific
values with environment variables; the shared parser in
`src/shared/config/env-schema.js` validates both the Next.js server and CLI
database scripts. Do not copy credentials from the reference project into code.

| Setting | Default | Purpose |
| --- | --- | --- |
| `SESSION_LIFETIME_SECONDS` | `1296000` (15 days) | Session cookie and DB expiry |
| `MAX_MEDIA_BYTES` | `2097152` (2 MB) | Maximum uploaded image size; may be lowered, but DB currently caps at 2 MB |
| `MAX_MEDIA_PER_ACCOUNT` | `50` | Maximum active uploaded images per account; unattached images older than 24 hours are pruned on next upload |
| `DB_POOL_MAX` | `10` | Maximum app DB connections per process |
| `DB_IDLE_TIMEOUT_MS` | `30000` | Close idle DB connections |
| `DB_CONNECTION_TIMEOUT_MS` | `5000` | Stop waiting for an unavailable DB |
| `PASSWORD_RESET_TTL_MINUTES` | `30` | Single-use reset-link lifetime |
| `RATE_LIMIT_*` | See `.env.example` | Persistent per-account/email and whole-app limits for auth, uploads, and reports |
| `MAIL_PROVIDER` | `disabled` | Use `resend` with `MAIL_FROM` and `RESEND_API_KEY` for real reset email |

`DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, and `SESSION_SECRET` are required.
`DATABASE_SSL` must be `true` or `false`; use `true` when your PostgreSQL
endpoint requires trusted TLS. Server environment changes require an app
restart. Browser-visible `NEXT_PUBLIC_*` values are set during the Next.js
build, so changing those requires a rebuild. `.env.local` is for local work;
the Linux deployment provides `.env.production` to Docker at runtime.

Password recovery requires `MAIL_PROVIDER=resend`, a verified `MAIL_FROM`
sender, and `RESEND_API_KEY`. With the default `MAIL_PROVIDER=disabled`, the
forgot-password endpoint responds 503 instead of pretending an email was sent.
Never put the API key in a `NEXT_PUBLIC_*` variable. The global auth limits
reduce attacks across many email addresses, but a public deployment still
needs a reverse-proxy/edge abuse policy.

The development Compose file binds PostgreSQL only to `127.0.0.1:5433`,
avoiding a conflict with other local databases and keeping it off the LAN.

## Demo data for local development

After migration, populate the local development database with a connected demo
community: 8 owners, 8 pets, 34 posts, follows, likes, comments, matches,
chats, and notifications.

```bash
npm run db:seed
```

Log in with `aom@petory.local` (or `niran@petory.local`) and password
`petory-demo-password-2026`. The script refuses `NODE_ENV=production` and only
removes earlier `@petory.local` demo accounts before it rebuilds the dataset.

## Quality checks

Run these before creating a pull request:

```bash
npm run lint
npm run test
npm run build
npm audit --omit=dev
```

`npm run build` runs lint and tests first, then produces a standalone Next.js
artifact in `.next/standalone`. It intentionally uses the stable webpack build
path. A self-hosted deployment must copy `public` and `.next/static` into that
artifact, or serve those assets through a CDN.

The integration suite uses a **disposable local/CI database only**. It checks
that the database contains no non-demo accounts and refuses a remote DB before
it changes rate-limit counters. Reseeding deletes all `@petory.local` accounts:

```bash
npm run db:seed
PETORY_INTEGRATION_DB=1 npm run test:integration
```

The browser portion uses local Google Chrome on macOS. On Linux/CI, install
Playwright's headless Chromium first with
`npx playwright install --with-deps --only-shell chromium`. Screenshots are
written to ignored `test-results/`. GitHub Actions runs the same gate from the
repository-root `.github/workflows/verify.yml`; the app is in `petory/`.

The Linux Docker and Cloudflare deployment is tracked separately and requires
real database, mail, DNS, TLS, backup, and monitoring configuration before a
public release.
