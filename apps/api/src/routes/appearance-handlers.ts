import { publicAppearanceInputSchema, type PublicAppearance, type SiteSettings } from "@sunny/shared";
import type { SettingsDatabase, SettingsTable } from "./profile-handlers.js";

function projectAppearance(settings: Record<string, unknown>, defaults: PublicAppearance): PublicAppearance {
  const result = publicAppearanceInputSchema.safeParse({
    publicBannerUrl: settings.publicBannerUrl,
    publicBannerPositionX: settings.publicBannerPositionX,
    publicBannerPositionY: settings.publicBannerPositionY,
    publicColorMode: settings.publicColorMode,
    publicDesignTokens: settings.publicDesignTokens,
    publicCustomCss: settings.publicCustomCss
  });
  return result.success ? result.data : defaults;
}

export function createAppearanceHandlers(
  database: SettingsDatabase,
  settingsTable: SettingsTable,
  defaults: PublicAppearance,
  insertDefaults: SiteSettings
) {
  const get = async () => {
    const [settings] = await database.select().from(settingsTable).limit(1);
    return settings ? projectAppearance(settings as Record<string, unknown>, defaults) : defaults;
  };

  const put = async (request: { body?: unknown }, reply: { code(statusCode: number): unknown; send(payload: unknown): unknown }) => {
    const input = publicAppearanceInputSchema.safeParse(request.body);
    if (!input.success) {
      reply.code(400);
      return reply.send({ message: "公共外观设置无效", issues: input.error.flatten() });
    }
    await database.insert(settingsTable).values({ id: "primary", ...insertDefaults, ...input.data })
      .onConflictDoUpdate({
        target: settingsTable.id,
        set: { ...input.data, updatedAt: new Date() }
      });
    return reply.send(input.data);
  };

  return { get, put };
}
