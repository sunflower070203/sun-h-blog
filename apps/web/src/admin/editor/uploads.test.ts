import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { uploadFiles } from "./uploads.ts";

describe("multi-image uploads", () => {
  it("preserves order and keeps successful files when one fails", async () => {
    const files = [{ name: "a.png" }, { name: "b.png" }] as File[];
    const result = await uploadFiles(files, async (file) => {
      if (file.name === "b.png") throw new Error("上传失败");
      return { url: "/media/2026-08-10/a.png" };
    });
    assert.equal(result[0]?.status, "success");
    assert.equal(result[0]?.url, "/media/2026-08-10/a.png");
    assert.equal(result[1]?.status, "error");
    assert.equal(result[1]?.error, "上传失败");
  });
});
