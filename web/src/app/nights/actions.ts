"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { getEnv } from "@/config/env";
import { getDb } from "@/db";
import { n8nWebhook } from "@/n8n/client";
import { createNight, startGeneration } from "@/nights/service";

// No auth until ticket 02: anyone can create a Night and start generation.

export async function planNight() {
  const night = await createNight(getDb().db);
  redirect(`/nights/${night.id}`);
}

export async function generateProposals(nightId: string) {
  const env = getEnv();
  const callN8n = n8nWebhook({
    baseUrl: env.N8N_WEBHOOK_BASE_URL,
    secret: env.N8N_SIGNING_SECRET,
  });
  await startGeneration(getDb().db, nightId, {
    appBaseUrl: env.APP_BASE_URL,
    notifyN8n: (context) => callN8n("night-generate", context),
  });
  refresh();
}
