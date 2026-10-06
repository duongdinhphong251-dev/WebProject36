# Setup and Demo Guide

This guide covers local setup, demo accounts, verification commands, and application features. See [README.md](README.md) for the project overview and [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for the directory tree and request flow.

## Local setup

### Prerequisites

- Node.js 20+ and npm.
- PostgreSQL 16, either installed locally or running in Docker.
- PowerShell for the commands below.

Start in the project root. The default backend configuration uses PostgreSQL on port `5433`, database `tuoi_db`, and the local development credentials in `pj-be/.env.example`.

### 1. Start PostgreSQL

```powershell
docker run --name pj-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tuoi_db -p 5433:5432 -d postgres:16
```

If the container already exists, run `docker start pj-postgres` instead. If you use a local PostgreSQL installation, create the database and update the backend environment settings to match it.

### 2. Configure and start the backend

```powershell
cd pj-be
Copy-Item .env.example .env
npm ci
```

Edit `pj-be/.env` and replace `JWT_SECRET` with a random secret before starting the API. To generate one:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Copy the generated value into `JWT_SECRET`, then run:

```powershell
npm run db:migrate
npm run start:dev
```

The migration updates the schema and creates the demo accounts if they do not exist. On an empty database, it also seeds cities, sample spas, and vouchers.

**Existing databases:** the migration removes legacy tables and columns for banners, tracking, and Korean content. Read `pj-be/drizzle/20260924_restructure.sql` before running it against data you need to keep.

### 3. Start the frontend

Open another terminal at the project root:

```powershell
cd pj-fe
Copy-Item .env.example .env.local
npm ci
npm run dev
```

The default `API_URL` in `.env.local` is `http://localhost:8081/api/v1`. Update it if the backend uses a different address.

| Service | Local address |
| --- | --- |
| Web application | http://localhost:3000 |
| Backend API | http://localhost:8081/api/v1 |
| Swagger documentation | http://localhost:8081/api/docs |

Private environment files such as `.env` and `.env.local` must not be committed. The demo credentials below are for local development only.

## Demo accounts

These accounts are created by the migration using the default seed settings:

| Role | Phone number | Password | Workspace |
| --- | --- | --- | --- |
| User | `0900000003` | `User@123456` | `/me` |
| Spa owner | `0900000002` | `Owner@123456` | `/owner` |
| Admin | `0900000001` | `Admin@123456` | `/admin` |

New users register at `/register`; spa owners register at `/register/owner`. Signed-in users can browse the catalog at `/vi` or `/en`.

## Running checks

From the project root, run the backend checks:

```powershell
cd pj-be
npx tsc --noEmit
npm test -- --runInBand
npm run lint
npm run build
```

With PostgreSQL and the backend running, use another terminal in `pj-be/` for the API checks:

```powershell
npm run test:smoke
npm run test:audit
```

The smoke script exercises the main API workflows. The audit script checks permissions, invalid input, state transitions, and concurrent requests. Both scripts clean up their temporary database records.

From a terminal at the project root, run the frontend checks:

```powershell
cd pj-fe
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Accounts and access control

Users register at `/register`; spa owners register at `/register/owner`. Public registration cannot create admin accounts. Sign-in uses a phone number and password.

The backend hashes passwords with bcrypt and issues a JWT valid for seven days. Next.js stores the token in an HttpOnly cookie. For authenticated API requests, the guard verifies the token, reads the current account status from the database, and checks the role. Banning an account blocks access with existing tokens. Signing out only removes the browser cookie.

Main files: `pj-be/src/core/auth.ts`, `pj-fe/src/components/AuthForm.tsx`, `pj-fe/src/app/api/auth/[action]/route.ts`, `pj-fe/src/proxy.ts`.

## Spa catalog

The `/vi` and `/en` pages display approved spas and vouchers. The city filter sends a `city` query parameter to the backend. Keyword search using `q` filters the list in Next.js. Switching languages changes the URL prefix and displayed labels.

Main files: `pj-be/src/core/catalog.ts`, `pj-fe/src/app/[locale]/page.tsx`, `pj-fe/src/components/Header.tsx`, `pj-fe/src/components/CatalogCards.tsx`.

## Saved spas, reviews, and bookings

Users can save spas, submit ratings from 1 to 5 stars, and book future appointments. The `/me` page shows saved spas, reviews, bookings, and claimed vouchers.

Each user can review a spa once. A database uniqueness constraint prevents duplicates from concurrent requests. Appointment times are converted from local time to ISO timestamps before being sent to the backend.

Main files: `pj-be/src/core/member.ts`, `pj-fe/src/components/SpaActions.tsx`, `pj-fe/src/app/me/page.tsx`, `pj-fe/src/lib/date-time.ts`.

## Vouchers

Owners create vouchers for their own spas. New or edited vouchers require admin approval before appearing in the catalog. Users claim a voucher and redeem it by booking from its detail page.

The backend checks that the voucher belongs to the selected spa, is approved, and has not expired. Changing the claimed voucher from `available` to `used` and inserting the booking happen in one transaction. If the booking insert fails, the voucher update is rolled back. The update condition only accepts an `available` voucher, preventing repeated use.

Related tables: `deals`, `claimed_vouchers`, `bookings`. Main files: `pj-be/src/core/member.ts`, `pj-be/src/core/owner.ts`, `pj-fe/src/app/[locale]/deals/[id]/page.tsx`.

## Spa management and images

Owners create and edit spas and vouchers and view their own customer bookings and statistics. The backend checks ownership before allowing an edit. Editing a spa returns it to pending approval.

Cover images support PNG, JPEG, and WebP, with a 2 MB limit. The backend checks the file type and signature and stores the file in `pj-be/uploads/`; the database stores its path. A successful upload followed by a failed form submission can leave an unused image on disk.

Main files: `pj-be/src/core/owner.ts`, `pj-fe/src/components/OwnerForm.tsx`, `pj-fe/src/components/OwnerFields.tsx`, `pj-fe/src/app/owner/page.tsx`.

## Administration

Admins view accounts, spas, vouchers, and statistics; approve or reject content; and ban or unban users and owners. Admin accounts cannot be banned.

Main files: `pj-be/src/core/admin.ts`, `pj-fe/src/app/admin/page.tsx`.

## Database and tests

`pj-be/src/core/schema.ts` defines the tables. `pj-be/drizzle/20260924_restructure.sql` contains the migration, and `pj-be/src/core/setup.ts` runs it and seeds demo data. Read the migration before running it against a database containing data you need to keep, because it removes legacy tables and columns.

- `pj-be/src/core/validation.spec.ts`: DTO and ID validation checks.
- `pj-be/scripts/smoke.ts`: main API workflows.
- `pj-be/scripts/audit.ts`: access control, invalid input, and concurrent requests.
- `pj-fe/tests/helpers.test.ts`: date/time and request helper checks.

Smoke and audit checks require PostgreSQL and the backend to be running. Commands are listed under Running checks above; results depend on the code version and execution environment.

## Demo walkthrough

Use three separate browser profiles for the user, owner, and admin. Tabs in the same profile share the sign-in cookie.

1. Sign in with the three demo accounts listed above.
2. As the owner, create a spa and upload a cover image.
3. As the admin, approve the spa. As the user, confirm that it appears in the catalog.
4. As the user, filter by city, search, save the spa, submit a review, and book an appointment.
5. As the owner, create a voucher; then approve it as the admin.
6. As the user, claim the voucher and use it for a booking. Check its used status in `/me`.
7. As the owner, check the booking and its voucher name.
8. As the admin, ban a test account, verify that access is blocked, and unban it.

Choose a future appointment time. When repeating the demo, use a new voucher and an account that has not already reviewed the selected spa.

## Current limitations

- Payments and invoicing are not implemented.
- Vouchers are marked as used when a booking is created; there is no confirmation step at the spa.
- Bookings remain `pending`; confirmation, cancellation, completion, and time conflict checks are not implemented.
- Reviews do not require a previous visit or booking.
- Vietnamese and English support mainly covers the catalog. Management pages, account pages, and many descriptions remain in Vietnamese.
