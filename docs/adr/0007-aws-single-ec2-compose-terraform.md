# 0007 — AWS: one EC2 instance, Docker Compose, Terraform

- Status: Accepted
- Date: 2026-11-17

## Context
The app, n8n and Postgres need to run somewhere always on for a live demo. The project should also show real AWS experience, but managed AWS services have fixed hourly floors that are expensive for a near-zero-traffic app.

## Decision
- **Compute:** one Graviton EC2 instance (t4g.small, 2 GB) with a 20 GB gp3 volume and an Elastic IP, running the Compose stack: web, n8n, Postgres, Caddy.
- **Infrastructure as code:** everything in `infra/terraform/`.
- **Access:** SSM Session Manager, no SSH port. The instance's IAM role gets least-privilege access to ECR, S3 backups, SSM parameters and SES.
- **Secrets:** SSM Parameter Store SecureStrings, rendered into `.env` at deploy.
- **Deploy:** GitHub Actions with an OIDC role (no long-lived keys) builds ARM images → ECR → SSM Run Command `docker compose pull && up -d`.
- **Backups:** nightly `pg_dump` of the app and n8n databases to S3, with a lifecycle rule.
- **TLS:** Caddy auto-TLS for the app and n8n subdomains.
- **Email:** Amazon SES with domain identity and DKIM. Request production access early.
- **Cost guard:** AWS Budgets alerts at $10 and $20.
- **Cost:** paid from one account's new-account credits, then about $17–19/mo.

## Alternatives considered
- **Lightsail:** cheaper flat price, but a weaker AWS story.
- **ECS Fargate + RDS + ALB:** the strongest AWS story, but about $60–100/mo (ALB, RDS and NAT gateway floors).
- **Hetzner or another VPS:** €4–5/mo for more RAM, but no AWS experience.
- **Oracle Cloud Always Free:** $0, but capacity and idle-reclaim risk.

## Consequences
- One box is a single point of failure. That's acceptable for a demo, and nightly S3 backups bound the loss.
- Containers have no AWS-specific code apart from SES SMTP credentials, so moving to another host means changing the Terraform and DNS, not the app.
- Moving to ECS/RDS later is a natural follow-up ADR if the project grows.
