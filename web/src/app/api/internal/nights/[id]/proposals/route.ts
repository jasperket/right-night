import { getEnv } from "@/config/env";
import { ProposalSet } from "@/contracts/proposal-set";
import { getDb } from "@/db";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verifyRequest } from "@/lib/signing";
import { storeProposals } from "@/nights/service";

// n8n → app: the generate-proposals workflow delivers a Night's Proposals.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.text();

  const verified = verifyRequest({
    secret: getEnv().N8N_SIGNING_SECRET,
    body,
    timestamp: request.headers.get(TIMESTAMP_HEADER),
    signature: request.headers.get(SIGNATURE_HEADER),
  });
  if (!verified.ok) return Response.json({ error: verified.error }, { status: 401 });

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return Response.json({ error: "body is not JSON" }, { status: 400 });
  }
  const parsed = ProposalSet.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues }, { status: 400 });
  }

  const result = await storeProposals(getDb().db, id, parsed.data);
  switch (result.status) {
    case "stored":
      return Response.json({ stored: true });
    case "duplicate":
      return Response.json({ stored: false, duplicate: true });
    case "not_found":
      return Response.json({ error: "unknown night or run" }, { status: 404 });
    case "conflict":
      return Response.json({ error: result.error }, { status: 409 });
  }
}
