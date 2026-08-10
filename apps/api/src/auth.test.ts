import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSessionToken, sessionCookieOptions, verifySessionToken } from "./auth.ts";

describe("admin session", () => {
  it("round-trips a signed admin id", async () => {
    const token = await createSessionToken("admin-1", "a-secret-at-least-32-characters-long");
    const session = await verifySessionToken(token, "a-secret-at-least-32-characters-long");
    assert.equal(session?.adminId, "admin-1");
  });

  it("rejects a token signed with another secret", async () => {
    const token = await createSessionToken("admin-1", "a-secret-at-least-32-characters-long");
    const session = await verifySessionToken(token, "another-secret-at-least-32-chars");
    assert.equal(session, null);
  });

  it("allows secure cookies to follow the deployment protocol", () => {
    assert.equal(sessionCookieOptions(false).secure, false);
    assert.equal(sessionCookieOptions(true).secure, true);
  });
});
