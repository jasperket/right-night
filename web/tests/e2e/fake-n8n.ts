// Test double for n8n's generate-proposals workflow: verifies the app's signed
// `night-generate` webhook, answers 200, then posts 2 Proposals to the callback.
// Run directly by Node (type stripping), so imports carry their .ts extension.
import { createServer, type IncomingMessage } from "node:http";
import {
  SIGNATURE_HEADER,
  TIMESTAMP_HEADER,
  signRequest,
  verifyRequest,
} from "../../src/lib/signing.ts";

const port = Number(process.env.FAKE_N8N_PORT ?? 3199);
const secret = process.env.N8N_SIGNING_SECRET ?? "";

const header = (req: IncomingMessage, name: string) => {
  const value = req.headers[name.toLowerCase()];
  return typeof value === "string" ? value : null;
};

const proposal = (title: string, startHour: number) => ({
  title,
  summary: `${title} for the group`,
  startAt: `2026-11-20T${startHour}:00:00+08:00`,
  endAt: `2026-11-20T${startHour + 2}:00:00+08:00`,
  estCostPerPerson: 30,
  venues: [{ name: `${title} place` }],
  weatherNote: "Clear skies",
  rationale: "Hard-coded by the fake n8n",
  source: "ai",
});

async function deliver({
  callbackUrl,
  idempotencyKey,
}: {
  callbackUrl: string;
  idempotencyKey: string;
}) {
  const body = JSON.stringify({
    idempotencyKey,
    proposals: [proposal("Ramen and arcade", 18), proposal("Rooftop karaoke", 20)],
  });
  const res = await fetch(callbackUrl, {
    method: "POST",
    headers: { "content-type": "application/json", ...signRequest({ secret, body }) },
    body,
  });
  if (!res.ok) console.error("callback failed", res.status, await res.text());
}

// Night ids whose next night-generate webhook answers 503, set by tests via /control/fail/<id>.
const failNext = new Set<string>();

createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    if (req.method === "GET") return res.writeHead(200).end("ok");
    const control = (req.url ?? "").match(/^\/control\/fail\/([^/]+)$/);
    if (control) {
      failNext.add(control[1]);
      return res.writeHead(204).end();
    }
    if (req.url !== "/webhook/night-generate") return res.writeHead(404).end();
    const verified = verifyRequest({
      secret,
      body,
      timestamp: header(req, TIMESTAMP_HEADER),
      signature: header(req, SIGNATURE_HEADER),
    });
    if (!verified.ok) return res.writeHead(401).end();
    const { nightId } = JSON.parse(body);
    if (failNext.delete(nightId)) return res.writeHead(503).end();
    res.writeHead(200, { "content-type": "application/json" }).end('{"accepted":true}');
    setTimeout(() => deliver(JSON.parse(body)).catch(console.error), 300);
  });
}).listen(port);
