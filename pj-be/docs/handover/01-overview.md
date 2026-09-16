# 01 — Overview: Tech Stack & Repositories

## Product

**Glow Explore** — discovery platform for spa and beauty **deals** in Vietnam. The backend exposes a REST API consumed by the Next.js frontend and SEO-driven listing pages.

## Tech stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js **20+** |
| Framework | **NestJS** + **TypeScript** |
| HTTP | Express (via Nest), global prefix `/api/v1` |
| Database | **PostgreSQL** |
| ORM | **Drizzle ORM** (`drizzle-orm` + `pg` connection pool) |
| Validation | `class-validator` / `class-transformer` (global `ValidationPipe`) |
| API docs | **Swagger** at `/api/docs` |
| Images | **Google Places Photos API**, **Google Cloud Storage** (optional cache/upload) |
| Prod hosting | **Google Cloud Run** (API + FE) |
| Legacy / integration host | **GCE VM** + Docker Compose (optional path on branch `main`) |
| CI | **GitLab CI** with **self-hosted runner** (tag `vm-docker`) |
| DNS / CDN | **Cloudflare** (production custom domains) |

## Repository structure (`tuoi-be`)

```
tuoi-be/                          # Git root — deploy and build from here
├── src/
│   ├── main.ts                   # Bootstrap, CORS, Swagger, global prefix
│   ├── app.module.ts             # Config validation (Joi), module imports
│   ├── db/
│   │   ├── db.module.ts          # Global Drizzle provider
│   │   ├── db.provider.ts        # pg Pool (DB_POOL_MAX, timeouts)
│   │   └── schema/               # Table definitions (Drizzle)
│   ├── modules/
│   │   ├── locations/            # Cities, districts, wards, places
│   │   ├── services/             # Service categories (massage, etc.)
│   │   ├── deals/                # Deals list, detail, flash sale
│   │   ├── spas/                 # Spa detail, recommended spas
│   │   ├── pages/                # Full page payload (SEO listings)
│   │   ├── url-resolver/         # URL → SEO context (seo_nodes)
│   │   ├── seo/                  # SEO URLs export, templates
│   │   ├── home/                 # Home banners
│   │   └── tracking/             # View/click events
│   └── common/
│       ├── filters/              # HTTP exception → `{ error: { statusCode, message, path } }`
│       ├── interceptors/         # Success envelope `{ data, meta? }`
│       ├── photo-cache/          # Places → GCS, signed URLs
│       └── utils/                # Deal schedule, publication window, geo, etc.
├── scripts/                      # Ops: GCP IAM, domain mapping, SQL, backfill
├── specs/                        # GCP prod architecture (detailed)
├── docs/                         # Handover + domain rules
├── Dockerfile                    # Multi-stage Node 20 Alpine
├── docker-compose.yml            # VM deploy (single `backend` service)
├── .gitlab-ci.yml                # CI/CD pipelines
└── .env.example                  # Local env template (no secrets)
```

## Frontend (separate repo)

- **Repo:** `glowexplore.com/tuoi-fe`
- **Stack:** Next.js, calls `NEXT_PUBLIC_API` (e.g. `https://api.glowexplore.com` in production)
- **Prod image:** `prod-fe-web` in same Artifact Registry repo `prod-containers`

## Environments (summary)

| Environment | Branch (typical) | Where it runs | Purpose |
|-------------|------------------|---------------|---------|
| **Local dev** | any | Developer machine | Feature work, Swagger |
| **VM / integration** | `main` | GCE VM + Docker | Legacy deploy via GitLab Registry + SSH; can serve as staging |
| **GCP production** | `release` | Cloud Run `prod-backend` | Live API behind `api.glowexplore.com` (target) |

There is **no separate Cloud Run “staging” service** in the current pipeline; use **local dev** or the **VM** path for pre-production testing.

## External dependencies

- **PostgreSQL** — single shared database (`agentspa` schema/tables). All app instances connect via `DB_*` env vars.
- **Google Maps Platform** — Places Photos, Place Details (photo cache).
- **GCS** — spa image storage; API returns signed URLs for private buckets.
- **GitLab** — source control, container registry (VM path), CI variables.
- **GCP** — Artifact Registry, Cloud Run, Secret Manager, (optional) Cloud SQL.

## Key conventions

- API responses: success body wrapped in `{ data, meta? }`; errors as `{ error: { statusCode, message, path } }`.
- Deals expose campaign window as `startAt` / `endAt` and `start_at` / `end_at` (ISO 8601).
- Locale query param: `vi` | `en` | `ko` on many endpoints.

Next: [02-application-architecture.md](./02-application-architecture.md)
