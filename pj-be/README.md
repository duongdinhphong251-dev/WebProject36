# tuoi-be

Backend API for glowexplore.com — a platform for discovering spa & beauty deals in Vietnam.

**Handover / architecture (English):** [docs/handover/README.md](./docs/handover/README.md) — tech stack, environments, CI/CD, GCP prod, Cloudflare, operations.

## Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Docs**: Swagger UI (`/api/docs`)

## Requirements

- Node.js >= 20
- Access to PostgreSQL database

## Getting Started

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env

# Start in development mode
npm run start:dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | PostgreSQL host | — |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | — |
| `DB_USER` | Database user | — |
| `DB_PASSWORD` | Database password | — |

## API Overview

All routes are prefixed with `/api/v1`.

| Module | Endpoints |
|--------|-----------|
| **Locations** | `GET /locations/cities` `GET /locations/cities/:slug/districts` `GET /locations/districts/:slug/wards` |
| **Services** | `GET /services` |
| **Deals** | `GET /deals` `GET /deals/flash-sale` `GET /deals/:id` |
| **Spas** | `GET /spas/:id` |
| **Pages** | `GET /pages/resolve?url=` |

Full interactive docs available at `http://localhost:3000/api/docs` when running locally.

## Project Structure

```
src/
├── db/
│   ├── db.module.ts          # Global Drizzle module
│   ├── db.provider.ts        # PostgreSQL pool setup
│   └── schema/               # Drizzle table definitions
├── modules/
│   ├── locations/            # Cities, districts, wards
│   ├── services/             # Service categories
│   ├── deals/                # Deal listing, detail, flash sale
│   ├── spas/                 # Spa detail
│   └── pages/                # Page resolver (full-page payload)
└── common/
    ├── dto/                  # Shared DTOs (pagination)
    ├── filters/              # Global exception filter
    ├── interceptors/         # Global response envelope
    └── utils/                # Geo (haversine), helpers
```

## Scripts

```bash
npm run start:dev   # Development with hot reload
npm run build       # Production build
npm run start:prod  # Run production build
npm run lint        # Lint
```
