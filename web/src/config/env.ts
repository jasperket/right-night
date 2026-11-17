import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string({ error: "DATABASE_URL is required" })
    .regex(/^postgres(ql)?:\/\//, "DATABASE_URL must be a postgres:// URL"),
  // Shared HMAC secret for app ⇄ n8n calls (ADR 0002).
  N8N_SIGNING_SECRET: z
    .string({ error: "N8N_SIGNING_SECRET is required" })
    .min(32, "N8N_SIGNING_SECRET must be at least 32 characters"),
  // Base URL of n8n production webhooks, e.g. http://localhost:5678/webhook
  N8N_WEBHOOK_BASE_URL: z.url({ error: "N8N_WEBHOOK_BASE_URL must be a URL" }),
  // Where n8n reaches the app for callbacks.
  APP_BASE_URL: z.url({ error: "APP_BASE_URL must be a URL" }),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${issues}`);
  }
  return result.data;
}
