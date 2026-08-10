# Local Media Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store uploaded blog images in a persistent Docker volume and serve them through Nginx without requiring S3 credentials.

**Architecture:** The API writes validated images to `/data/media` and records `/media/...` URLs in PostgreSQL. A shared `media_data` Docker volume is mounted read-write by the API and read-only by Nginx, which serves the files directly.

**Tech Stack:** TypeScript, Fastify, Node.js filesystem APIs, Node test runner, Docker Compose, Nginx

---

### Task 1: Define and test local media storage behavior

**Files:**
- Modify: `apps/api/src/services/media.test.ts`
- Modify: `apps/api/src/services/media.ts`

- [ ] **Step 1: Write failing tests**

Add tests that expect:

```ts
assert.equal(extensionForMediaType("image/jpeg"), "jpg");
assert.equal(extensionForMediaType("image/png"), "png");
assert.equal(extensionForMediaType("text/html"), undefined);
```

Add a temporary-directory test that calls:

```ts
const stored = await storeLocalMedia({
  rootDirectory,
  contentType: "image/png",
  bytes: Buffer.from("image"),
  now: new Date("2026-07-29T00:00:00.000Z"),
  id: "fixed-id"
});

assert.equal(stored.objectKey, "2026-07-29/fixed-id.png");
assert.equal(stored.url, "/media/2026-07-29/fixed-id.png");
assert.deepEqual(
  await readFile(join(rootDirectory, "2026-07-29", "fixed-id.png")),
  Buffer.from("image")
);
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
node --experimental-strip-types apps/api/src/services/media.test.ts
```

Expected: failure because `extensionForMediaType` and `storeLocalMedia` are not exported.

- [ ] **Step 3: Implement the minimal storage service**

In `apps/api/src/services/media.ts`, add MIME-to-extension mapping and:

```ts
export async function storeLocalMedia(input: {
  rootDirectory: string;
  contentType: string;
  bytes: Buffer;
  now?: Date;
  id?: string;
}) {
  const extension = extensionForMediaType(input.contentType);
  if (!extension) throw new Error("Unsupported media type");

  const date = (input.now ?? new Date()).toISOString().slice(0, 10);
  const objectKey = `${date}/${input.id ?? randomUUID()}.${extension}`;
  const destination = join(input.rootDirectory, objectKey);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, input.bytes, { flag: "wx" });
  return { objectKey, url: `/media/${objectKey}` };
}
```

- [ ] **Step 4: Verify GREEN**

Run the focused test and then `npm test`. Expected: all tests pass.

### Task 2: Route uploads to local storage

**Files:**
- Modify: `apps/api/src/config.ts`
- Modify: `apps/api/src/routes/media.ts`
- Modify: `apps/api/package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Make configuration require `MEDIA_ROOT`**

Replace S3 fields with:

```ts
MEDIA_ROOT: z.string().min(1).default("/data/media")
```

- [ ] **Step 2: Replace the S3 upload**

Remove the AWS client and call:

```ts
const stored = await storeLocalMedia({
  rootDirectory: config.MEDIA_ROOT,
  contentType: part.mimetype,
  bytes: buffer
});

const [record] = await db.insert(media).values({
  objectKey: stored.objectKey,
  url: stored.url,
  contentType: part.mimetype
}).returning();
```

- [ ] **Step 3: Remove the unused AWS SDK**

Run:

```powershell
npm uninstall @aws-sdk/client-s3 -w @sunny/api
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm test
npm run typecheck
npm run build
```

Expected: all commands exit with code 0.

### Task 3: Persist and serve media in containers

**Files:**
- Modify: `docker-compose.yml`
- Modify: `deploy/nginx.conf`
- Modify: `.env.example`

- [ ] **Step 1: Add shared mounts**

Mount `media_data:/data/media` in `api`, mount
`media_data:/usr/share/nginx/media:ro` in `web`, and declare:

```yaml
volumes:
  postgres_data:
  media_data:
```

- [ ] **Step 2: Add Nginx media route**

Add:

```nginx
location /media/ {
  alias /usr/share/nginx/media/;
  expires 7d;
  add_header Cache-Control "public, max-age=604800";
  try_files $uri =404;
}
```

- [ ] **Step 3: Simplify environment configuration**

Set:

```dotenv
MEDIA_ROOT=/data/media
BLOG_PORT=8080
```

Remove all S3 variables from `.env.example`.

- [ ] **Step 4: Verify Compose**

Create a temporary non-secret `.env` from `.env.example`, run:

```powershell
docker compose config
```

If local Docker is unavailable, validate with the existing YAML parser and
repeat `docker compose config` on the server before startup.

### Task 4: Package and deploy

**Files:**
- Replace: `outputs/sunny-blog-fullstack-deploy.zip`
- Create on server: `/opt/sunny-blog/sunny-blog-fullstack/.env`

- [ ] **Step 1: Build a clean deployment archive**

Exclude `node_modules`, build output, `.env`, work files, and documentation.
Verify the archive contains the API sources, frontend sources, Dockerfiles,
Compose file, Nginx config, and lockfile.

- [ ] **Step 2: Upload and extract**

Upload the archive with Tencent Cloud File Management and extract it over
`/opt/sunny-blog/sunny-blog-fullstack`.

- [ ] **Step 3: Create secrets on the server**

Generate random `POSTGRES_PASSWORD` and `SESSION_SECRET` on the server. The
administrator email and password must be entered by the user directly in the
server interface and must not be sent through chat.

- [ ] **Step 4: Build and start**

Run:

```sh
cd /opt/sunny-blog/sunny-blog-fullstack
docker compose up -d --build
docker compose ps
```

Expected: PostgreSQL, API, and web services are running; PostgreSQL and API
health checks are healthy.

- [ ] **Step 5: Open and verify port 8080**

After containers are healthy, add a Tencent Cloud firewall rule allowing TCP
8080. Verify the public homepage loads and OpenClaw remains available on its
existing port 80 route.

- [ ] **Step 6: Verify upload flow**

Sign in through `/admin`, upload one valid image, confirm the response URL
starts with `/media/`, and confirm the image is retrievable.
