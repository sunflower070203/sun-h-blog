import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import multipart from "@fastify/multipart";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { verifySessionToken } from "./auth.js";
import { config } from "./config.js";
import { authRoutes } from "./routes/auth.js";
import { mediaRoutes } from "./routes/media.js";
import { postRoutes } from "./routes/posts.js";
import { settingsRoutes } from "./routes/settings.js";

declare module "fastify" {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}

export async function buildApp() {
  const app = Fastify({ logger: true, trustProxy: true, bodyLimit: 2 * 1024 * 1024 });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cookie);
  await app.register(cors, { origin: false, credentials: true });
  await app.register(rateLimit, { global: false });
  await app.register(multipart);
  await app.register(fp(async (server) => {
    server.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
      const token = request.cookies.sunny_session;
      const session = token ? await verifySessionToken(token, config.SESSION_SECRET) : null;
      if (!session) {
        await reply.code(401).send({ message: "请先登录" });
        return;
      }
      if (request.method !== "GET") {
        const cookieToken = request.cookies.sunny_csrf;
        const headerToken = request.headers["x-csrf-token"];
        if (!cookieToken || headerToken !== cookieToken) {
          await reply.code(403).send({ message: "安全校验已过期，请重新登录" });
          return;
        }
      }
    });
  }));
  app.get("/health", async () => ({ status: "ok" }));
  await app.register(authRoutes, { prefix: "/api" });
  await app.register(postRoutes, { prefix: "/api" });
  await app.register(mediaRoutes, { prefix: "/api" });
  await app.register(settingsRoutes, { prefix: "/api" });
  return app;
}
