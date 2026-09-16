# Nhom36 — Spa & Deal Search Web

A web project that lets users search for spa vouchers by location.

Supports Vietnamese and English.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS |
| **Backend** | NestJS 11, Drizzle ORM, TypeScript |
| **Database** | PostgreSQL 16 |
| **Runtime** | Node.js >= 20 |

## Project Structure
 

Project/
├── pj-be/ # Backend — NestJS + Drizzle
│ ├── src/ # Source code
│ │ ├── modules/ # Business modules (spas, deals, services, ...)
│ │ ├── db/ # Schema + DB connection
│ │ └── common/ # Shared utilities
│ ├── drizzle/ # Migration files
│ ├── seed-demo.sql # Sample data (spas, deals, banners, cities)
│ ├── seed-locations.sql# Sample data (spa_locations)
│ └── .env.example # Config template
├── pj-fe/ # Frontend — Next.js
│ ├── src/
│ │ ├── app/ # Routes (App Router)
│ │ ├── components/ # UI components
│ │ ├── services/ # Backend API calls
│ │ └── i18n/ # Multi-language (vi/en)
│ ├── public/ # Images, assets
│ └── .env.exemple # Config template
├── HUONG-DAN-CHAY.md # Detailed setup instructions
└── README.md # This file



## Features

- 🏠 **Homepage:** ad banners, 4 main service categories, recommended spas (currently only 1 service is active)
- 🔍 **Search spas by region:** filter by city, price, rating
- 💆 **Spa detail:** information, images, reviews
- 🎁 **Deals / promotions:** display currently running offers
- 🌐 **Multi-language:** Vietnamese, English

## Workflow



\## workflow 

User

│

▼

Frontend (Next.js) ← port 3000

│

│ HTTP API call

▼

Backend (NestJS) ← port 8081

│

│ SQL query

▼

Database (PostgreSQL) ← port 5433



\*\*In simple terms:\*\*

\- \*\*Frontend\*\* displays the UI to users.

\- \*\*Backend\*\* handles logic and fetches data from the database.

\- \*\*Database\*\* stores all information (spas, deals, cities, banners...).

\- Frontend calls Backend over HTTP, Backend reads Database and returns the result.



\---



\## Example Flow



\*\*User opens `/massage-spa/ha-noi`:\*\*



1\. Frontend receives the URL and calls the Backend API.

2\. Backend looks up the `city\_id` for Hanoi.

3\. Backend fetches massage deals in Hanoi.

4\. Backend returns JSON to Frontend.

5\. Frontend renders the spa + deal list.



\---



\- For setup and run instructions, see `Nhom36.md`.







