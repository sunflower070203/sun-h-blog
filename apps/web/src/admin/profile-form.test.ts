import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { emptyRichDocument } from "@sunny/shared";

import {
  MAX_PROFILE_LINKS,
  canAddProfileLink,
  canSaveProfile,
  createEmptyProfileLink,
  createProfileLinkId,
  createProfileLinks,
  removeProfileLink,
  serializeProfileLinks,
  updateProfileLink
} from "./profile-form.ts";

describe("profile link form helpers", () => {
  it("creates an editor id when Web Crypto is unavailable on HTTP", () => {
    assert.match(createProfileLinkId(undefined), /^profile-link-/);
  });

  it("creates the expected empty link", () => {
    assert.deepEqual(createEmptyProfileLink(() => "new-id"), { uiId: "new-id", title: "", url: "https://", description: "", icon: "link" });
  });

  it("assigns stable ids when profile links enter the editor", () => {
    let nextId = 0;
    const links = createProfileLinks([
      { title: "first", url: "https://first.example", description: "one", icon: "github" },
      { title: "second", url: "https://second.example", description: "two", icon: "website" }
    ], () => `id-${++nextId}`);

    assert.deepEqual(links.map((link) => link.uiId), ["id-1", "id-2"]);
  });

  it("updates one link by id without mutating the source or changing order", () => {
    const links = createProfileLinks([
      { title: "first", url: "https://first.example", description: "one" },
      { title: "second", url: "https://second.example", description: "two" }
    ], (() => { let id = 0; return () => `id-${++id}`; })());
    const updated = updateProfileLink(links, "id-2", "title", "changed");

    assert.notEqual(updated, links);
    assert.deepEqual(links.map((link) => link.title), ["first", "second"]);
    assert.deepEqual(updated.map((link) => link.title), ["first", "changed"]);
    assert.equal(updated[0], links[0]);
    assert.notEqual(updated[1], links[1]);
  });

  it("removes by id without changing the remaining ids or order", () => {
    const links = createProfileLinks([
      { title: "first", url: "https://first.example", description: "one" },
      { title: "second", url: "https://second.example", description: "two" },
      { title: "third", url: "https://third.example", description: "three" }
    ], (() => { let id = 0; return () => `id-${++id}`; })());

    const remaining = removeProfileLink(links, "id-2");
    assert.deepEqual(remaining.map((link) => [link.uiId, link.title]), [["id-1", "first"], ["id-3", "third"]]);
    assert.equal(links.length, 3);
  });

  it("strips editor ids before serialization", () => {
    const links = [{ uiId: "private-id", title: "site", url: "https://example.com", description: "desc", icon: "github" as const }];
    assert.deepEqual(serializeProfileLinks(links), [{ title: "site", url: "https://example.com", description: "desc", icon: "github" }]);
  });

  it("allows saving only a loaded idle profile", () => {
    const profile = { displayName: "Sunny", avatarUrl: null, bio: "", links: [], aboutContent: emptyRichDocument, introContent: emptyRichDocument };
    assert.equal(canSaveProfile(null, false, false, false), false);
    assert.equal(canSaveProfile(profile, true, false, false), false);
    assert.equal(canSaveProfile(profile, false, true, false), false);
    assert.equal(canSaveProfile(profile, false, false, true), false);
    assert.equal(canSaveProfile(profile, false, false, false), true);
  });

  it("allows no more than twelve editable links", () => {
    assert.equal(MAX_PROFILE_LINKS, 12);
    assert.equal(canAddProfileLink(Array.from({ length: 11 })), true);
    assert.equal(canAddProfileLink(Array.from({ length: 12 })), false);
  });
});

describe("ProfilePage contract", () => {
  const source = readFileSync(new URL("./ProfilePage.tsx", import.meta.url), "utf8");

  for (const label of ["显示名称", "头像", "个人简介", "链接标题", "链接地址", "链接说明"]) {
    it(`includes the ${label} label`, () => assert.match(source, new RegExp(label)));
  }

  it("references the profile API entry points", () => {
    assert.match(source, /api\.getAdminProfile\(\)/);
    assert.match(source, /api\.upload\(/);
    assert.match(source, /api\.updateProfile\(/);
  });

  it("includes a complete rich About editor with multi-image support", () => {
    assert.match(source, /完整个人介绍/);
    assert.match(source, /MultiImagePanel/);
    assert.match(source, /aboutEditor\?\.getJSON/);
    assert.match(source, /accept="\.md,text\/markdown,text\/plain"/);
    assert.match(source, /markdownToDocument/);
  });

  it("keeps a separate compact homepage intro without README import controls", () => {
    assert.match(source, /首页简介/);
    assert.match(source, /introEditor/);
    assert.match(source, /createIntroEditorExtensions/);
    assert.match(source, /iconOptions/);
  });

  it("connects the profile fieldset to an accessible legend", () => {
    assert.match(source, /<fieldset className="profile-fields"/);
    assert.match(source, /<legend className="visually-hidden">个人资料编辑<\/legend>/);
  });
});
