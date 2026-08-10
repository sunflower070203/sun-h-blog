import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  COOKIE_SECURE: z.enum(["true", "false"]).default("true").transform((value) => value === "true"),
  MEDIA_ROOT: z.string().min(1).default("/data/media")
});

export const config = envSchema.parse(process.env);
