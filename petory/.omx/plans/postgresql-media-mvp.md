# Petory Media in PostgreSQL — MVP Plan

## Goal

Allow 10–20 active users to upload profile, pet, and post images while keeping all image bytes in PostgreSQL. The implementation must enforce a bounded storage budget, serve images safely through authenticated application routes, and preserve a clean migration path to R2/S3 later.

## Decision

Store original image bytes as PostgreSQL `BYTEA` in a new private `media_files` table. Existing `accounts.avatar_url`, `pet_media.storage_key`, and `post_media.storage_key` remain compatibility fields but will reference an opaque media ID/path rather than a direct object-store URL.

This is acceptable for the current target only if uploads are bounded:

- JPEG, PNG, or WebP only
- Maximum 3 MB request payload and 2 MB stored file
- One avatar per account; five images per pet/post
- No video, GIF, SVG, or arbitrary file upload
- A server route controls reads; raw database access is never exposed to the browser

## Current Evidence

- `accounts.avatar_url` exists but does not store bytes: `db/migrations/001_initial_schema.sql:4-18`.
- Pet and post media already have metadata tables but `storage_key` assumes external storage: `db/migrations/001_initial_schema.sql:59-65`, `99-105`.
- Current UI has image placeholders in profile, pet form/detail, post modal/cards/detail: `src/app/petory/ui.jsx:54`, `components/PetForm.jsx:25`, `components/Modals.jsx:75`.
- Route handlers already use same-origin validation, sessions, Zod schemas, and server-only DB access; media must follow the same pattern.

## Acceptance Criteria

1. A logged-in owner can upload and replace one avatar, and it persists after logout/login.
2. A pet/post owner can upload up to five images; a non-owner receives 404/403 and cannot read private media by guessing IDs.
3. Invalid MIME type, invalid image signature, files over 2 MB stored, or more than five images receive 422.
4. Image responses include the stored MIME type, `X-Content-Type-Options: nosniff`, cache policy, and do not expose database or filesystem details.
5. Uploading, serving, deleting, and ownership checks have integration tests against PostgreSQL.
6. Production build, lint, unit tests, and integration tests pass in CI.

## Implementation Steps

1. Add migration `002_media_files.sql`.
   - Create `media_files(id UUID, owner_id UUID, bytes BYTEA, mime_type TEXT, size_bytes INTEGER, sha256 TEXT, created_at, deleted_at)`.
   - Add CHECK constraints for allowed MIME values and `size_bytes <= 2097152`.
   - Add `media_id UUID` foreign keys to accounts, pet_media, and post_media, retaining old textual fields only during migration compatibility.
   - Add partial ownership/lookup indexes.

2. Add server-only media service under `src/server/media/`.
   - Parse multipart `FormData` only in route handlers.
   - Validate extension-independent magic bytes for JPEG/PNG/WebP; do not trust browser-supplied MIME type.
   - Calculate SHA-256 and enforce size/count limits before insert.
   - Use transaction-scoped ownership checks for attach/replace/delete operations.
   - Put all policy constants in one module so they can be reused in tests and changed later.

3. Add API routes.
   - `POST /api/media/avatar`
   - `POST /api/pets/:petId/media`
   - `POST /api/posts/:postId/media`
   - `GET /api/media/:mediaId` (authenticated; access policy based on resource visibility)
   - `DELETE /api/media/:mediaId` (owner only)
   - All mutations require current session and same-origin validation.

4. Add browser media client and UI wiring.
   - Replace `ImageSlot` upload placeholders with file inputs and local preview state.
   - Use returned media ID routes as image URLs; never embed base64 image data in React state or JSON API payloads.
   - Show upload error, progress/pending state, and a replace/remove action.
   - Update profile, pet, and post view models to prefer a database media URL and fall back to the current placeholder.

5. Database hygiene and operational limits.
   - Add a documented backup job that uses `pg_dump` and verifies restore to a non-production database.
   - Monitor `media_files` total bytes and per-account usage with a SQL health/maintenance query.
   - Set a review threshold: move to R2/S3 when media exceeds 5 GB, database backup exceeds 15 minutes, or sustained image traffic degrades application latency.

6. Tests and verification.
   - Unit test magic-byte validator, MIME mismatch, size/count policy, and owner policy.
   - Integration test multipart upload/read/delete with two accounts and PostgreSQL.
   - Browser E2E test avatar and pet upload, refresh persistence, non-owner denial, and invalid-file message.
   - Run `npm run db:migrate`, lint, unit/integration tests, production build, and Linux Compose smoke test.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Database grows from unbounded uploads | Hard limits, count limits, monitoring, and 5 GB migration threshold |
| Image parser vulnerabilities | Restrict formats, validate signatures, do not transform arbitrary content in-process initially |
| Slow DB backups | Nightly `pg_dump`, restore drill, and explicit storage threshold |
| Unauthorized image reads | Route-level resource authorization rather than public database IDs |
| Later R2/S3 migration | Opaque `media_id` route keeps UI/API independent from storage backend |

## Linux Deployment Notes

- PostgreSQL volume must be backed up separately from the app image.
- Run migrations before starting the new app container.
- Nginx/Caddy should terminate TLS; the app remains bound to loopback as in `docker-compose.production.yml`.
- Do not mount user uploads as host files; PostgreSQL volume is the source of truth for this MVP.

## Stop Conditions

Do not implement image processing, video, a public CDN, or R2/S3 in this MVP. Stop and switch storage design if the defined capacity/backup thresholds are reached.
