import type { FastifyInstance } from "fastify";
import { config } from "../config.js";
import { db } from "../db/index.js";
import { media } from "../db/schema.js";
import { storeLocalMedia, validateMedia } from "../services/media.js";

export async function mediaRoutes(app: FastifyInstance) {
  app.post("/admin/media", { preHandler: app.authenticate }, async (request, reply) => {
    const part = await request.file({ limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
    if (!part) return reply.code(400).send({ message: "请选择图片" });
    const buffer = await part.toBuffer();
    if (!validateMedia(part.mimetype, buffer.byteLength)) return reply.code(415).send({ message: "仅支持 10MB 内的 JPG、PNG、WebP 或 GIF" });

    const stored = await storeLocalMedia({
      rootDirectory: config.MEDIA_ROOT,
      contentType: part.mimetype,
      bytes: buffer
    });
    const [record] = await db.insert(media).values({
      objectKey: stored.objectKey,
      url: stored.url,
      contentType: part.mimetype
    }).returning();
    return reply.code(201).send(record);
  });
}
