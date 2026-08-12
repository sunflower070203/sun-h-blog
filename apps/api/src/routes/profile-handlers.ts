import { publicProfileInputSchema, type PublicProfile, type SiteSettings } from "@sunny/shared";

export type SettingsDatabase = Pick<typeof import("../db/index.js").db, "select" | "insert">;
export type SettingsTable = typeof import("../db/schema.js").siteSettings;

function toPublicProfile(settings: PublicProfile): PublicProfile {
  return {
    displayName: settings.displayName,
    avatarUrl: settings.avatarUrl,
    bio: settings.bio,
    links: settings.links,
    aboutContent: settings.aboutContent
  };
}

export function createProfileHandlers(
  database: SettingsDatabase,
  settingsTable: SettingsTable,
  defaultPublicProfile: PublicProfile,
  defaultSiteSettings: SiteSettings
) {
  const get = async () => {
    const [settings] = await database.select().from(settingsTable).limit(1);
    return settings ? toPublicProfile(settings) : defaultPublicProfile;
  };

  const put = async (request: { body?: unknown }, reply: { code(statusCode: number): unknown; send(payload: unknown): unknown }) => {
    const input = publicProfileInputSchema.safeParse(request.body);
    if (!input.success) {
      reply.code(400);
      return reply.send({ message: "个人资料无效", issues: input.error.flatten() });
    }
    await database.insert(settingsTable).values({
      id: "primary",
      ...defaultSiteSettings,
      ...input.data
    }).onConflictDoUpdate({
      target: settingsTable.id,
      set: { ...input.data, updatedAt: new Date() }
    });
    return reply.send(input.data);
  };

  return { get, put };
}
