import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { extensionForMediaType, storeLocalMedia, validateMedia } from "./media.ts";

describe("media validation", () => {
  it("accepts safe web images", () => {
    assert.equal(validateMedia("image/jpeg", 1024), true);
  });

  it("rejects executable content and oversized images", () => {
    assert.equal(validateMedia("text/html", 1024), false);
    assert.equal(validateMedia("image/png", 11 * 1024 * 1024), false);
  });

  it("maps supported media types to safe extensions", () => {
    assert.equal(extensionForMediaType("image/jpeg"), "jpg");
    assert.equal(extensionForMediaType("image/png"), "png");
    assert.equal(extensionForMediaType("text/html"), undefined);
  });

  it("stores media in a dated directory and returns its public URL", async () => {
    const rootDirectory = await mkdtemp(join(tmpdir(), "sunny-media-"));

    try {
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
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });
});
