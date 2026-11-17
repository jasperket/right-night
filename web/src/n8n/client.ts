import type { NightContext } from "@/contracts/night-context";
import { signRequest } from "@/lib/signing";

// app → n8n: calls a production webhook with a signed JSON body (ADR 0002).
export function n8nWebhook(config: { baseUrl: string; secret: string }) {
  return async function call(name: "night-generate", payload: NightContext) {
    const body = JSON.stringify(payload);
    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/${name}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...signRequest({ secret: config.secret, body }),
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`n8n ${name} webhook answered ${response.status}`);
    }
  };
}
