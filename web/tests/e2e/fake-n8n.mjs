// Test double for n8n's generate-proposals workflow: verifies the app's signed
// `night-generate` webhook, answers 200, then posts 2 Proposals to the callback.
import { createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";

const port = Number(process.env.FAKE_N8N_PORT ?? 3199);
const secret = process.env.N8N_SIGNING_SECRET;

const sign = (timestamp, body) =>
  createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

function verified(req, body) {
  const timestamp = req.headers["x-rn-timestamp"];
  const signature = req.headers["x-rn-signature"];
  if (!timestamp || !signature) return false;
  const expected = Buffer.from(sign(timestamp, body), "hex");
  const given = Buffer.from(signature, "hex");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const proposal = (title, startHour) => ({
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

async function deliver({ callbackUrl, idempotencyKey }) {
  const body = JSON.stringify({
    idempotencyKey,
    proposals: [proposal("Ramen and arcade", 18), proposal("Rooftop karaoke", 20)],
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const res = await fetch(callbackUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-RN-Timestamp": timestamp,
      "X-RN-Signature": sign(timestamp, body),
    },
    body,
  });
  if (!res.ok) console.error("callback failed", res.status, await res.text());
}

createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    if (req.method === "GET") return res.writeHead(200).end("ok");
    if (req.url !== "/webhook/night-generate") return res.writeHead(404).end();
    if (!verified(req, body)) return res.writeHead(401).end();
    res.writeHead(200, { "content-type": "application/json" }).end('{"accepted":true}');
    setTimeout(() => deliver(JSON.parse(body)).catch(console.error), 300);
  });
}).listen(port);
