# Sunny Blog Local Media Storage Design

## Goal

Replace the mandatory S3-compatible image backend with persistent local
storage so the single-author blog can be deployed without COS credentials.
The change must preserve the existing upload API and must not interfere with
the OpenClaw services already running on the host.

## Architecture

The API and Nginx containers share a Docker named volume called `media_data`.
The API mounts the volume read-write at `/data/media`. Nginx mounts the same
volume read-only at `/usr/share/nginx/media`.

Authenticated uploads continue to use `POST /api/admin/media`. The API writes
accepted images below:

`/data/media/YYYY-MM-DD/<uuid>.<extension>`

The media database row stores the relative object key and the public URL:

`/media/YYYY-MM-DD/<uuid>.<extension>`

Nginx serves `/media/*` directly from the read-only volume. The existing
frontend and `/api/*` proxy behavior remains unchanged.

## Validation and Failure Handling

- Accept only JPEG, PNG, WebP, and GIF files.
- Keep the existing 10 MB maximum and one-file-per-request limit.
- Derive the stored extension from the validated MIME type instead of trusting
  the original filename.
- Create the dated target directory before writing.
- Return an upload error without inserting a database row if the file write
  fails.
- Remove S3 variables from required runtime configuration.

## Deployment

- Add a `media_data` named volume to Docker Compose.
- Mount it read-write in `api` and read-only in `web`.
- Keep the public blog port configurable and set it to `8080` for this server,
  because OpenClaw already owns port `80`.
- Do not modify or stop OpenClaw services.
- Open TCP port `8080` in the Tencent Cloud firewall only after the blog
  containers are healthy.

## Backup Boundary

Container recreation must not remove uploaded images. A complete blog backup
must include both the PostgreSQL volume and the `media_data` volume. Server
reinstallation or accidental Docker-volume deletion can still destroy local
media, so remote backups remain future operational work.

## Verification

- A unit test proves MIME types map to safe extensions.
- A unit test proves local media writes create dated directories and return
  the expected public URL.
- Existing media validation tests remain green.
- TypeScript checks and production builds pass.
- `docker compose config` succeeds with the new environment file.
- After deployment, all containers are healthy, an authenticated image upload
  returns a `/media/...` URL, and that URL is retrievable through Nginx.
