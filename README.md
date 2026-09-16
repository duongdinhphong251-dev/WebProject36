# Nhom36 - Spa and Deal Search Web

A web project that lets users search for spa vouchers by location. Supports Vietnamese and English.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | NestJS 11, Drizzle ORM, TypeScript |
| Database | PostgreSQL 16 |
| Runtime | Node.js >= 20 |

## Project Structure

```
Project/
|-- pj-be/                  # Backend - NestJS + Drizzle
|   |-- src/                # Source code
|   |   |-- modules/        # Business modules
|   |   |-- db/             # Schema + DB connection
|   |   \-- common/         # Shared utilities
|   |-- drizzle/            # Migration files
|   |-- seed-demo.sql       # Sample data
|   |-- seed-locations.sql  # Sample data
|   \-- .env.example        # Config template
|-- pj-fe/                  # Frontend - Next.js
|   |-- src/
|   |   |-- app/            # Routes
|   |   |-- components/     # UI components
|   |   |-- services/       # Backend API calls
|   |   \-- i18n/           # Multi-language
|   |-- public/             # Images, assets
|   \-- .env.exemple        # Config template
|-- HUONG-DAN-CHAY.md       # Setup instructions
\-- README.md               # This file
```

## Features

- Homepage: ad banners, 4 main service categories, recommended spas
- Search spas by region: filter by city, price, rating
- Spa detail: information, images, reviews
- Deals and promotions: display currently running offers
- Multi-language: Vietnamese, English

## Workflow

```
User
  |
  v
Frontend (Next.js)     <- port 3000
  |
  | HTTP API call
  v
Backend (NestJS)       <- port 8081
  |
  | SQL query
  v
Database (PostgreSQL)  <- port 5433
```

**In simple terms:**

- Frontend displays the UI to users.
- Backend handles logic and fetches data from the database.
- Database stores all information.
- Frontend calls Backend over HTTP, Backend reads Database and returns the result.

## Example Flow

User opens /massage-spa/ha-noi:

1. Frontend receives the URL and calls the Backend API.
2. Backend looks up the city_id for Hanoi.
3. Backend fetches massage deals in Hanoi.
4. Backend returns JSON to Frontend.
5. Frontend renders the spa and deal list.

## Notes

- For setup and run instructions, see Nhom36.md.