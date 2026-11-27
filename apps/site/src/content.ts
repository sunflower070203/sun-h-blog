import { readFileSync } from "node:fs";
import type { PostDetail, PublicAppearance, PublicProfile } from "@sunny/shared";
import { defaultPublicAppearance } from "../../web/src/appearance";
import { emptyProfile } from "../../web/src/home-data";
import { parseSnapshot } from "./snapshot.mjs";

type Snapshot = { profile: PublicProfile; appearance: PublicAppearance; posts: PostDetail[] };
const source = process.env.SUNNY_SITE_SNAPSHOT;
export const snapshot: Snapshot = source
  ? parseSnapshot(JSON.parse(readFileSync(source, "utf8")))
  : { profile: emptyProfile, appearance: defaultPublicAppearance, posts: [] };

export function articlePath(slug: string): string {
  return "/posts/" + encodeURIComponent(slug);
}
