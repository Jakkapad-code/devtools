# Petory on a Linux Docker host

This stack runs one Next.js app, one PostgreSQL/PostGIS database, a one-shot
migration job, and Caddy as the only public entry point. The database and app
have no host port mappings. Use an x86-64/AMD64 Linux host for the final dry run;
the same Dockerfile can be built natively on ARM during development.

## Before starting

- Install Docker Engine with the Compose plugin. Allow inbound TCP 80/443 and
  UDP 443 only if this host is intended to serve them. Check that another
  service is not already using those ports.
- Point `APP_DOMAIN` at the final hostname. On Cloudflare, proxy its DNS record
  and use **Full (strict)** TLS. Create a Cloudflare Origin CA certificate for
  that exact hostname (or use a publicly trusted certificate). An Origin CA
  certificate is not trusted by browsers connecting directly to the IP.
- Store the certificate and private key **outside the repository** as
  `origin.pem` and `origin-key.pem` in `PETORY_CERT_DIR`. Protect the directory
  and key from other host users. Do not commit or send the private key.
- Arrange an external backup destination and real mail provider credentials
  before opening registration to others. Do not run `npm run db:seed` here.

## Configure and start

From the `petory` directory on the Linux host:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Edit `.env.production`: set `APP_DOMAIN`, `NEXT_PUBLIC_APP_URL` and
`ALLOWED_ORIGINS` to the same HTTPS hostname; set `PETORY_CERT_DIR` to an
absolute host directory containing the two certificate files. Generate unique
random `POSTGRES_PASSWORD` and `SESSION_SECRET` values. Use a URL-safe password
(hexadecimal works) because Compose builds `DATABASE_URL` from it. Configure
`MAIL_PROVIDER=resend`, a verified `MAIL_FROM`, and a real `RESEND_API_KEY` for
password-reset email. Never use the example values for an internet-facing
deployment.

```bash
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

Compose waits for a healthy database, then a successful migration, then a
healthy app before starting Caddy. If migration fails, app/Caddy do not start;
inspect `docker compose --env-file .env.production -f docker-compose.production.yml
logs migrate database` and fix the cause before retrying. The only public
container ports are 80 and 443. `NEXT_PUBLIC_*` values are fixed at image
build time, so rebuild after changing the public URL. Runtime server settings
need an app restart.

Check `https://APP_DOMAIN/api/health` through Cloudflare: it should return
`{"status":"ok"}`. Check login and registration through the public hostname.
If the certificate is a Cloudflare Origin CA certificate, do not use a direct
browser-to-IP test as a TLS verdict; use Cloudflare's proxied hostname.

## Updates

Take and verify a backup first (see [BACKUP.md](BACKUP.md)). Then build the
updated images, run the migration job, and restart the app:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml build app migrate
docker compose --env-file .env.production -f docker-compose.production.yml run --rm migrate
docker compose --env-file .env.production -f docker-compose.production.yml up -d app caddy
docker compose --env-file .env.production -f docker-compose.production.yml ps
```

The SQL migrations are forward-only. A code rollback may require a compatible
database state or a tested backup restore; do not assume changing the image
reverses migrations. Keep the previous image/commit until validation passes.

## Operational checks

- Monitor `/api/health`, `docker compose ... ps`, container restarts, disk
  capacity, TLS certificate expiry, and mail delivery errors.
- Keep Docker, the host OS, and images patched. Do not expose PostgreSQL or the
  Next.js app port from this Compose file.
- Restrict direct origin access at the host firewall to Cloudflare IP ranges
  where the deployment environment permits it. Full (strict) authenticates
  the origin certificate but does not, by itself, prevent direct origin traffic.
