# Petory

Petory is a Next.js application for a pet-owner community. The existing UI is
being migrated from in-memory demo data to a production backend.

## Run locally

Requirements: Node.js 20.9 or newer and npm.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The application begins at
`/petory/login`.

`DATABASE_URL` and `SESSION_SECRET` are server-only values. Never commit
`.env.local` or a real secret.

To start the local PostgreSQL/PostGIS service, run `docker compose up -d` and
then `npm run db:migrate`. The compose file exposes PostgreSQL on port `5433`
to avoid conflicting with another local database.

## Quality checks

Run these before creating a pull request or deploying:

```bash
npm run lint
npm run test
npm run build
```

`npm run build` runs lint and tests first, then produces a standalone Next.js
artifact in `.next/standalone`. It intentionally uses the stable webpack build
path. A self-hosted deployment must copy `public` and `.next/static` into that
artifact, or serve those assets through a CDN.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
