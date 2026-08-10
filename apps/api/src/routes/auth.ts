import argon2 from "argon2";
import { eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createSessionToken, sessionCookieOptions } from "../auth.js";
import { config } from "../config.js";
import { db } from "../db/index.js";
import { admins } from "../db/schema.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200)
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", { config: { rateLimit: { max: 5, timeWindow: "15 minutes" } } }, async (request, reply) => {
    const input = loginSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ message: "请输入有效邮箱和密码" });

    const [admin] = await db.select().from(admins).where(eq(admins.email, input.data.email.toLowerCase())).limit(1);
    if (!admin || !(await argon2.verify(admin.passwordHash, input.data.password))) {
      return reply.code(401).send({ message: "邮箱或密码错误" });
    }

    const token = await createSessionToken(admin.id, config.SESSION_SECRET);
    reply.setCookie("sunny_session", token, {
      ...sessionCookieOptions(config.COOKIE_SECURE),
      httpOnly: true,
    });
    reply.setCookie("sunny_csrf", randomUUID(), {
      ...sessionCookieOptions(config.COOKIE_SECURE),
      httpOnly: false,
    });
    return { admin: { email: admin.email } };
  });

  app.post("/auth/logout", async (_request, reply) => {
    reply.clearCookie("sunny_session", { path: "/" });
    reply.clearCookie("sunny_csrf", { path: "/" });
    return { ok: true };
  });
}
import { randomUUID } from "node:crypto";
