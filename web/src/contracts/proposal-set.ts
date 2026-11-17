import { z } from "zod";

export const Venue = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
});

export const Proposal = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  startAt: z.iso.datetime({ offset: true }),
  endAt: z.iso.datetime({ offset: true }),
  estCostPerPerson: z.number().int().nonnegative(),
  venues: z.array(Venue),
  weatherNote: z.string(),
  rationale: z.string(),
  source: z.enum(["ai", "fallback"]),
}).refine((p) => Date.parse(p.endAt) > Date.parse(p.startAt), {
  message: "endAt must be after startAt",
  path: ["endAt"],
});

// n8n → app `POST /api/internal/nights/:id/proposals` body.
export const ProposalSet = z.object({
  idempotencyKey: z.string().min(1),
  proposals: z.array(Proposal).min(2).max(3),
});

export type Proposal = z.infer<typeof Proposal>;
export type ProposalSet = z.infer<typeof ProposalSet>;
