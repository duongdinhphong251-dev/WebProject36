# Nhom36 · Spa & Voucher

A web application for discovering spas, booking appointments, and managing promotional vouchers. Developed by Group 36 as a web development course project.

The platform connects customers, spa owners, and administrators through three role-based workspaces. The catalog supports Vietnamese and English, with prices displayed in VND.

[Setup & Demo Guide](TEAM_GUIDE.md) · [Project Structure](PROJECT_STRUCTURE.md)

## Features

| Role | Capabilities |
| --- | --- |
| Customer | Browse and search spas, filter by city, save favorites, write reviews, claim vouchers, and book appointments. |
| Spa owner | Create and update spas and vouchers, upload cover images, and view customer bookings and statistics. |
| Administrator | Review and approve listings, view platform statistics, and manage account access. |

### Booking and voucher workflow

1. A spa owner submits a spa or voucher for review.
2. An administrator approves the listing before it appears in the catalog.
3. A signed-in customer browses spas and books an appointment, optionally using a claimed voucher.
4. The booking appears in both the customer and owner workspaces. A redeemed voucher is marked as used.

Voucher redemption and booking creation run in a single database transaction to prevent a voucher from being used more than once.

## Technology

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, CSS, Tailwind CSS 4 |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL 16, Drizzle ORM |
| Authentication | JWT, HttpOnly cookies, bcrypt |
| Validation & API documentation | class-validator, class-transformer, Swagger |
| Testing | Jest, Node.js test runner, API smoke and audit scripts |

## Repository Layout

```text
pj-fe/                 Next.js frontend and API proxy routes
pj-be/                 NestJS backend, database schema, and API checks
README.md              Project overview
TEAM_GUIDE.md          Setup, demo accounts, checks, and feature guide
PROJECT_STRUCTURE.md  Detailed directory tree and request flow
```

The frontend forwards authenticated requests to the backend through Next.js server components and API routes. NestJS handles authorization, validation, and database operations. Uploaded cover images are stored on the backend host.

## Scope

The current version supports spa discovery, appointment booking, voucher management, and content moderation. Payments, invoicing, booking confirmation or cancellation, and appointment conflict detection are not implemented. Bookings remain in the `pending` state, and vouchers are redeemed when a booking is created.

## Documentation

- [Setup & Demo Guide](TEAM_GUIDE.md): prerequisites, local setup, demo accounts, verification commands, and a walkthrough of each feature.
- [Project Structure](PROJECT_STRUCTURE.md): source files, request flow, and configuration layout.
