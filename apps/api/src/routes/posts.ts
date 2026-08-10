import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { adminPostQuerySchema, batchPostStatusSchema, postInputSchema } from "@sunny/shared";
import { db } from "../db/index.js";
import { posts, projects } from "../db/schema.js";
import { batchStatusValues } from "../services/posts.js";

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

  app.get("/admin/posts", { preHandler: app.authenticate }, async (request, reply) => {
    const query = adminPostQuerySchema.safeParse(request.query);
    if (!query.success) return reply.code(400).send({ message: "筛选条件无效" });
    const filters = [];
    if (query.data.status) filters.push(eq(posts.status, query.data.status));
    if (query.data.category) filters.push(eq(posts.category, query.data.category));
    if (query.data.q) filters.push(or(ilike(posts.title, `%${query.data.q}%`), ilike(posts.excerpt, `%${query.data.q}%`))!);
    const where = filters.length ? and(...filters) : undefined;
    const offset = (query.data.page - 1) * query.data.pageSize;
    const [items, totals] = await Promise.all([
      db.select().from(posts).where(where).orderBy(desc(posts.updatedAt)).limit(query.data.pageSize).offset(offset),
      db.select({ value: count() }).from(posts).where(where)
    ]);
    return { items, total: totals[0]?.value ?? 0, page: query.data.page, pageSize: query.data.pageSize };
  });

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

  app.post("/admin/posts/:id/copy", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const [source] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    if (!source) return reply.code(404).send({ message: "文章不存在" });
    let suffix = 1;
    let slug = `${source.slug}-copy`;
    while ((await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1)).length) {
      suffix += 1;
      slug = `${source.slug}-copy-${suffix}`;
    }
    const [copy] = await db.insert(posts).values({
      title: `${source.title}（副本）`, slug, excerpt: source.excerpt, content: source.content,
      category: source.category, tags: source.tags, coverUrl: source.coverUrl, coverAlt: source.coverAlt,
      featured: false, status: "draft", publishedAt: null
    }).returning();
    return reply.code(201).send(copy);
  });

  app.post("/admin/posts/batch-status", { preHandler: app.authenticate }, async (request, reply) => {
    const input = batchPostStatusSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ message: "批量操作内容无效" });
    return db.update(posts).set(batchStatusValues(input.data.status))
      .where(inArray(posts.id, input.data.ids)).returning();
  });

  app.delete("/admin/posts/:id", { preHandler: app.authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.delete(posts).where(eq(posts.id, id));
    return reply.code(204).send();
  });
}
