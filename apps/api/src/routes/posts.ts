import { and, desc, eq, ilike, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { postInputSchema } from "@sunny/shared";
import { db } from "../db/index.js";
import { posts, projects } from "../db/schema.js";

export async function postRoutes(app: FastifyInstance) {
  app.get("/projects", async () =>
    db.select().from(projects).orderBy(desc(projects.featured), desc(projects.year))
  );

  app.get("/tags", async () => {
    const rows = await db.select({ tags: posts.tags }).from(posts).where(eq(posts.status, "published"));
    return [...new Set(rows.flatMap((row) => row.tags))].sort((a, b) => a.localeCompare(b, "zh-CN"));
  });

  app.get("/posts", async (request) => {
    const query = request.query as { q?: string; category?: string };
    const filters = [eq(posts.status, "published")];
    if (query.category) filters.push(eq(posts.category, query.category));
    if (query.q) filters.push(or(ilike(posts.title, `%${query.q}%`), ilike(posts.excerpt, `%${query.q}%`))!);
    return db.select().from(posts).where(and(...filters)).orderBy(desc(posts.featured), desc(posts.publishedAt));
  });

  app.get("/posts/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    const [post] = await db.select().from(posts).where(and(eq(posts.slug, slug), eq(posts.status, "published"))).limit(1);
    return post ?? reply.code(404).send({ message: "文章不存在" });
  });

  app.get("/admin/posts", { preHandler: app.authenticate }, async () =>
    db.select().from(posts).orderBy(desc(posts.updatedAt))
  );

  app.get("/admin/posts/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return post ?? reply.code(404).send({ message: "文章不存在" });
  });

  app.post("/admin/posts", { preHandler: app.authenticate }, async (request, reply) => {
    const input = postInputSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ message: "文章内容不完整", issues: input.error.flatten() });
    const values = { ...input.data, publishedAt: input.data.status === "published" ? new Date() : null };
    try {
      const [created] = await db.insert(posts).values(values).returning();
      return reply.code(201).send(created);
    } catch {
      return reply.code(409).send({ message: "文章路径已存在" });
    }
  });

  app.put("/admin/posts/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const input = postInputSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ message: "文章内容不完整", issues: input.error.flatten() });
    const { id } = request.params as { id: string };
    const [updated] = await db.update(posts).set({
      ...input.data,
      publishedAt: input.data.status === "published" ? new Date() : null,
      updatedAt: new Date()
    }).where(eq(posts.id, id)).returning();
    return updated ?? reply.code(404).send({ message: "文章不存在" });
  });

  app.post("/admin/posts/:id/publish", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [post] = await db.update(posts).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(eq(posts.id, id)).returning();
    return post ?? reply.code(404).send({ message: "文章不存在" });
  });

  app.post("/admin/posts/:id/unpublish", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [post] = await db.update(posts).set({ status: "draft", publishedAt: null, updatedAt: new Date() }).where(eq(posts.id, id)).returning();
    return post ?? reply.code(404).send({ message: "文章不存在" });
  });

  app.delete("/admin/posts/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(posts).where(eq(posts.id, id));
    return reply.code(204).send();
  });
}
