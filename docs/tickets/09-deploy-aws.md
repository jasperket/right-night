# 09 — Deploy to AWS

**Depends on:** 08 (start the SES production-access request and the domain purchase much earlier, during ticket 02)

## Goal
A live, always-on demo on AWS, reproducible from Terraform. See [ADR 0007](../adr/0007-aws-single-ec2-compose-terraform.md).

## Scope
- `infra/terraform/`: EC2 t4g.small + 20 GB gp3 + Elastic IP; security group with 80/443 only; IAM instance role (ECR pull, S3 backups, SSM params, SES send); ECR repo; S3 backup bucket with a lifecycle rule; SSM SecureString params; SES domain identity + DKIM records; GitHub OIDC deploy role; AWS Budgets alerts at $10 and $20.
- `infra/compose.prod.yml` + `Caddyfile`: web, n8n, Postgres, Caddy with auto-TLS for the app and n8n subdomains.
- GitHub Actions deploy: build ARM images → ECR → SSM Run Command `docker compose pull && up -d`.
- Nightly `pg_dump` (app + n8n DBs) to S3, plus a tested restore.
- Import the n8n workflows from `n8n/workflows/` and set production credentials.
- Seed a demo Group for recruiters to try.

## Acceptance criteria
- `terraform apply` from a clean account plus one deploy run gives a working HTTPS site.
- No SSH port open; no long-lived AWS keys in GitHub.
- A restore from last night's backup works.
- Budget alerts are configured.

## Tests
- `terraform validate` + `tflint` in CI.
- Post-deploy smoke check against the live URL.
