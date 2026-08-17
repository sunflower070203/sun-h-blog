import type { FastifyInstance, FastifyPluginOptions } from "fastify";
import { siteSettingsInputSchema, type PublicProfile, type SiteSettings } from "@sunny/shared";
import { db } from "../db/index.js";
import { siteSettings } from "../db/schema.js";
import { defaultPublicAppearance, defaultPublicProfile, defaultSiteSettings } from "../services/settings.js";
import { createAppearanceHandlers } from "./appearance-handlers.js";
import { createProfileHandlers, type SettingsDatabase, type SettingsTable } from "./profile-handlers.js";

const primarySettingsId = "primary";

export type SettingsRouteOptions = FastifyPluginOptions & {
  database?: SettingsDatabase;
  settingsTable?: SettingsTable;
  defaultPublicProfile?: PublicProfile;
  defaultSiteSettings?: SiteSettings;
};

export async function settingsRoutes(app: FastifyInstance, options: SettingsRouteOptions) {
  const database = options.database ?? db;
  const settingsTable = options.settingsTable ?? siteSettings;
  const profile = createProfileHandlers(
    database,
    settingsTable,
    options.defaultPublicProfile ?? defaultPublicProfile,
    options.defaultSiteSettings ?? defaultSiteSettings
  );
  const appearance = createAppearanceHandlers(database, settingsTable, defaultPublicAppearance, defaultSiteSettings);
  app.get("/profile", profile.get);
  app.get("/admin/profile", { preHandler: app.authenticate }, profile.get);
  app.put("/admin/profile", { preHandler: app.authenticate }, profile.put);
  app.get("/appearance", appearance.get);
  app.get("/admin/appearance/public", { preHandler: app.authenticate }, appearance.get);
  app.put("/admin/appearance/public", { preHandler: app.authenticate }, appearance.put);

  app.get("/admin/settings", { preHandler: app.authenticate }, async () => {
    const [settings] = await database.select().from(settingsTable).limit(1);
    if (!settings) return defaultSiteSettings;
    return {
      wallpaperUrl: settings.wallpaperUrl,
      overlay: settings.overlay,
      blur: settings.blur,
      position: settings.position
    };
  });

  app.put("/admin/settings", { preHandler: app.authenticate }, async (request, reply) => {
    const input = siteSettingsInputSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ message: "外观设置无效", issues: input.error.flatten() });
    const [settings] = await database.insert(settingsTable).values({ id: primarySettingsId, ...input.data })
      .onConflictDoUpdate({
        target: settingsTable.id,
        set: { ...input.data, updatedAt: new Date() }
      }).returning();
    return reply.send(settings);
  });
}
