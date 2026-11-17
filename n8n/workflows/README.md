# n8n workflows

Exported workflow JSON, kept thin: the app owns state and rules ([ADR 0002](../../docs/adr/0002-app-owns-state-n8n-orchestrates.md)).

| Workflow | Trigger | Does |
| --- | --- | --- |
| `generate-proposals` | `POST /webhook/night-generate` (signed) | Verifies the HMAC, answers 200 (401 if bad), then posts Proposals to the Night's `callbackUrl`, signed. Ticket 01 stub: 2 hard-coded Proposals. |

Workflows read `N8N_SIGNING_SECRET` from the n8n container (set in `infra/.env`); it must match the app's.

## Import and publish

From the repo root, with the Compose stack running (in Git Bash, prefix with `MSYS_NO_PATHCONV=1`):

```bash
docker cp n8n/workflows/generate-proposals.json right-night-n8n-1:/tmp/generate-proposals.json
docker exec right-night-n8n-1 n8n import:workflow --input=/tmp/generate-proposals.json
docker exec right-night-n8n-1 n8n publish:workflow --id=rnGenerateProposals
docker restart right-night-n8n-1
```

## Export after editing in the n8n UI

```bash
docker exec right-night-n8n-1 n8n export:workflow --id=rnGenerateProposals --pretty --output=/tmp/generate-proposals.json
docker cp right-night-n8n-1:/tmp/generate-proposals.json n8n/workflows/generate-proposals.json
```
