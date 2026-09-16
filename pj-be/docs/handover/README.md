# Glow Explore Backend — Handover Documentation

English documentation for client teams taking over **tuoi-be** (NestJS API) and related infrastructure.

| Document | Contents |
|----------|----------|
| [01-overview.md](./01-overview.md) | Tech stack, repository layout, environments at a glance |
| [02-application-architecture.md](./02-application-architecture.md) | NestJS modules, data layer, cross-cutting concerns |
| [03-environments-and-cicd.md](./03-environments-and-cicd.md) | Dev, VM (`main`), GCP prod (`release`), GitLab CI/CD |
| [04-production-gcp-and-cloudflare.md](./04-production-gcp-and-cloudflare.md) | Cloud Run, DB, secrets, domains, Cloudflare DNS |
| [05-operations-runbook.md](./05-operations-runbook.md) | Deploy, health checks, logs, troubleshooting |

**Related docs (Vietnamese / detailed GCP steps):**

- [`../../specs/gcp-prod.md`](../../specs/gcp-prod.md) — GCP prod setup, domain verification, IAM scripts
- [`../flash-sale-rules.md`](../flash-sale-rules.md), [`../deals-table.md`](../deals-table.md) — business rules

**Repositories (GitLab):**

| Repo | Role |
|------|------|
| `glowexplore.com/tuoi-be` | This API (NestJS) |
| `glowexplore.com/tuoi-fe` | Next.js web app (separate repo) |

A local monorepo folder `deals_pj/` may contain both clones for convenience; **CI/CD and remotes are per GitLab project.**

---

**GCP project (production):** `services-project-490810` · **Region:** `asia-southeast1`
