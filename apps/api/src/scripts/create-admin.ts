import argon2 from "argon2";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, pool } from "../db/index.js";
import { admins } from "../db/schema.js";

const input = z.object({
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(12)
}).parse(process.env);

const email = input.ADMIN_EMAIL.toLowerCase();
const passwordHash = await argon2.hash(input.ADMIN_PASSWORD);
const [existing] = await db.select().from(admins).where(eq(admins.email, email)).limit(1);
if (existing) await db.update(admins).set({ passwordHash }).where(eq(admins.id, existing.id));
else await db.insert(admins).values({ email, passwordHash });
await pool.end();
console.log(`Admin account ready: ${email}`);
