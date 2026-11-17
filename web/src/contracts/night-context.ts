import { z } from "zod";

// app → n8n `night-generate` webhook payload. Ticket 03 adds the window, area and Night inputs.
export const NightContext = z.object({
  nightId: z.uuid(),
  idempotencyKey: z.string().min(1),
  callbackUrl: z.url(),
});

export type NightContext = z.infer<typeof NightContext>;
