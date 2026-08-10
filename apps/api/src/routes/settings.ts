import type { FastifyInstance } from "fastify";
import { siteSettingsInputSchema } from "@sunny/shared";
import { db } from "../db/index.js";
import { siteSettings } from "../db/schema.js";
import { defaultSiteSettings } from "../services/settings.js";

const primarySettingsId = "primary";

export async function settingsRoutes(app: FastifyInstance) {
  app.get("/admin/settings", { preHandler: app.authenticate }, async () => {
    const [settings] = await db.select().from(siteSettings).limit(1);
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
    const [settings] = await db.insert(siteSettings).values({ id: primarySettingsId, ...input.data })
      .onConflictDoUpdate({
        target: siteSettings.id,
        set: { ...input.data, updatedAt: new Date() }
      }).returning();
    return reply.send(settings);
  });
}
