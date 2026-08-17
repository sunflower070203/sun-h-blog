import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultPublicDesignTokens, emptyRichDocument } from "@sunny/shared";
import { buildApp } from "../app.ts";
import { createAppearanceHandlers } from "./appearance-handlers.ts";
import { createProfileHandlers } from "./profile-handlers.ts";

const defaultPublicProfile = { displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: emptyRichDocument, introContent: emptyRichDocument };
const defaultSiteSettings = { wallpaperUrl: null, overlay: 0.62, blur: 8, position: "center" as const };

class FakeReply {
  statusCode = 200;
  payload: unknown;

  code(statusCode: number) {
    this.statusCode = statusCode;
    return this;
  }

  send(payload: unknown) {
    this.payload = payload;
    return payload;
  }
}

function createFakeDb(rows: unknown[] = []) {
  const writes: { inserted?: Record<string, unknown>; updated?: Record<string, unknown> } = {};
  return {
    database: {
      select: () => ({ from: () => ({ limit: async () => rows }) }),
      insert: () => ({
        values: (inserted: Record<string, unknown>) => {
          writes.inserted = inserted;
          return {
            onConflictDoUpdate: ({ set }: { set: Record<string, unknown> }) => {
              writes.updated = set;
              return Promise.resolve();
            }
          };
        }
      })
    },
    writes
  };
}

async function setup(rows: unknown[] = []) {
  const fakeDb = createFakeDb(rows);
  const settingsTable = { id: "id" };
  const handlers = createProfileHandlers(
    fakeDb.database as never,
    settingsTable as never,
    defaultPublicProfile,
    defaultSiteSettings
  );
  return { ...fakeDb, handlers };
}

describe("profile routes", () => {
  it("enforces authentication through Fastify while keeping the public profile public", async () => {
    const fakeDb = createFakeDb([{
      displayName: "Sunny",
      avatarUrl: null,
      bio: "Notes",
      links: [],
      aboutContent: { type: "doc", content: [{ type: "paragraph" }] },
      introContent: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Short intro" }] }] },
      wallpaperUrl: "/private-wallpaper.png",
      overlay: 0.7,
      blur: 10,
      position: "top"
    }]);
    const app = await buildApp({
      settings: {
        database: fakeDb.database as never,
        settingsTable: { id: "id" } as never,
        defaultPublicProfile,
        defaultSiteSettings
      }
    });

    try {
      const publicResponse = await app.inject({ method: "GET", url: "/api/profile" });
      assert.equal(publicResponse.statusCode, 200);
      assert.deepEqual(publicResponse.json(), {
        displayName: "Sunny",
        avatarUrl: null,
        bio: "Notes",
        links: [],
        aboutContent: { type: "doc", content: [{ type: "paragraph" }] },
        introContent: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Short intro" }] }] }
      });

      assert.equal((await app.inject({ method: "GET", url: "/api/admin/profile" })).statusCode, 401);
      assert.equal((await app.inject({ method: "PUT", url: "/api/admin/profile", payload: defaultPublicProfile })).statusCode, 401);
      assert.equal(fakeDb.writes.inserted, undefined);
    } finally {
      await app.close();
    }
  });

  it("keeps the public profile unauthenticated and excludes appearance fields", async () => {
    const { handlers } = await setup([{
      displayName: "Sunny",
      avatarUrl: null,
      bio: "Notes",
      links: [],
      aboutContent: { type: "doc", content: [{ type: "paragraph" }] },
      introContent: emptyRichDocument,
      wallpaperUrl: "/media/2026-08-11/123e4567-e89b-12d3-a456-426614174000.png",
      overlay: 0.7,
      blur: 10,
      position: "top"
    }]);
    assert.deepEqual(await handlers.get(), {
      displayName: "Sunny",
      avatarUrl: null,
      bio: "Notes",
      links: [],
      aboutContent: { type: "doc", content: [{ type: "paragraph" }] },
      introContent: emptyRichDocument
    });
  });

  it("returns a clear 400 response for an invalid profile", async () => {
    const { handlers } = await setup();
    const reply = new FakeReply();

    await handlers.put({ body: { displayName: "" } }, reply);

    assert.equal(reply.statusCode, 400);
    assert.equal((reply.payload as { message: string }).message, "个人资料无效");
    assert.ok((reply.payload as { issues: unknown }).issues);
  });

  it("includes appearance defaults when inserting the singleton row", async () => {
    const { handlers, writes } = await setup();
    const body = { displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: emptyRichDocument, introContent: emptyRichDocument };

    await handlers.put({ body }, new FakeReply());

    assert.deepEqual(writes.inserted, { id: "primary", ...defaultSiteSettings, ...body });
  });

  it("updates only profile fields and the timestamp on conflict", async () => {
    const { handlers, writes } = await setup([{}]);
    const body = { displayName: "Sunny", avatarUrl: null, bio: "Updated", links: [], aboutContent: emptyRichDocument, introContent: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Independent" }] }] } };

    await handlers.put({ body }, new FakeReply());

    assert.deepEqual({ ...writes.updated, updatedAt: undefined }, { ...body, updatedAt: undefined });
    assert.ok(writes.updated?.updatedAt instanceof Date);
    for (const field of ["wallpaperUrl", "overlay", "blur", "position"]) {
      assert.equal(field in writes.updated!, false);
    }
  });
});

describe("public appearance routes", () => {
  const defaults = {
    publicBannerUrl: null,
    publicBannerPositionX: 50,
    publicBannerPositionY: 50,
    publicColorMode: "system" as const,
    publicDesignTokens: defaultPublicDesignTokens,
    publicCustomCss: ""
  };

  it("returns only public appearance fields and falls back from malformed stored tokens", async () => {
    const fakeDb = createFakeDb([{ ...defaults, publicDesignTokens: { version: 99 }, wallpaperUrl: "/private.png" }]);
    const handlers = createAppearanceHandlers(fakeDb.database as never, { id: "id" } as never, defaults, defaultSiteSettings);
    assert.deepEqual(await handlers.get(), defaults);
  });

  it("rejects unsafe custom CSS without writing", async () => {
    const fakeDb = createFakeDb();
    const handlers = createAppearanceHandlers(fakeDb.database as never, { id: "id" } as never, defaults, defaultSiteSettings);
    const reply = new FakeReply();
    await handlers.put({ body: { ...defaults, publicCustomCss: '@import "https://bad.example/style.css";' } }, reply);
    assert.equal(reply.statusCode, 400);
    assert.equal(fakeDb.writes.inserted, undefined);
  });
});
