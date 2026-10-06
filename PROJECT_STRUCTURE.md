# Project Structure and Request Flow

Generated directories such as `node_modules/`, `.next/`, and `dist/` are omitted from the source tree below.

```text
Project/
├── README.md                 # Setup, demo accounts, and checks
├── PROJECT_STRUCTURE.md      # Directory tree and request flow
├── TEAM_GUIDE.md             # Features and demo walkthrough
├── .gitignore
├── pj-be/
│   ├── .env.example
│   ├── .gitignore
│   ├── .prettierrc
│   ├── package.json          # Backend scripts and dependencies
│   ├── package-lock.json     # Locked dependency versions
│   ├── nest-cli.json
│   ├── eslint.config.mjs
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── drizzle/
│   │   └── 20260924_restructure.sql
│   ├── scripts/smoke.ts      # API workflow checks and test data cleanup
│   ├── scripts/audit.ts      # Permissions, invalid input, state, and concurrency
│   ├── uploads/              # Runtime image uploads (not committed)
│   └── src/
│       ├── main.ts           # NestJS startup, ValidationPipe, and Swagger
│       ├── app.module.ts     # Controller and guard registration
│       └── core/
│           ├── auth.ts       # Registration, sign-in, JWT, and roles
│           ├── catalog.ts    # Spa, voucher, and city catalog for signed-in users
│           ├── member.ts     # Saved spas, vouchers, reviews, and bookings
│           ├── owner.ts      # Spa/voucher management, uploads, and bookings
│           ├── ids.ts        # ID validation, including legacy spa UUIDs
│           ├── admin.ts      # Content approval and account status
│           ├── db.ts         # PostgreSQL connection through Drizzle
│           ├── schema.ts     # Database table definitions
│           ├── setup.ts      # Migration and seed data
│           └── validation.spec.ts
└── pj-fe/
    ├── .env.example
    ├── .gitignore
    ├── .dockerignore
    ├── package.json
    ├── package-lock.json
    ├── next.config.ts        # Standalone output and backend image rewrites
    ├── tsconfig.json
    ├── tsconfig.test.json
    ├── tests/helpers.test.ts # Local time and request helper checks
    ├── eslint.config.mjs
    ├── postcss.config.mjs
    ├── Dockerfile            # Frontend container using API_URL
    ├── docker-compose.yml   # Frontend service only
    ├── public/
    │   ├── favicon.png
    │   └── assets/
    │       ├── images/common/logo_x.png  # Team logo
    │       └── category/
    │           ├── massage-spa.png
    │           └── lam-dep.png
    └── src/
        ├── proxy.ts          # Redirects requests without a session cookie
        ├── lib/
        │   ├── api.ts        # Backend requests from Server Components
        │   ├── client-api.ts # Browser requests, uploads, and error handling
        │   └── date-time.ts  # Local time and ISO UTC conversion
        ├── components/
        │   ├── AuthForm.tsx
        │   ├── Header.tsx
        │   ├── Footer.tsx
        │   ├── CatalogCards.tsx
        │   ├── LogoutButton.tsx
        │   ├── MutationButton.tsx
        │   ├── OwnerForm.tsx
        │   ├── OwnerFields.tsx # Spa and voucher form fields
        │   └── SpaActions.tsx
        └── app/
            ├── layout.tsx
            ├── globals.css
            ├── global-error.tsx
            ├── not-found.tsx
            ├── robots.ts
            ├── login/page.tsx
            ├── register/page.tsx
            ├── register/owner/page.tsx
            ├── me/page.tsx
            ├── owner/page.tsx
            ├── admin/page.tsx
            ├── [locale]/layout.tsx
            ├── [locale]/page.tsx
            ├── [locale]/spas/[id]/page.tsx
            ├── [locale]/deals/[id]/page.tsx
            ├── api/auth/[action]/route.ts
            └── api/backend/[...path]/route.ts
```

## Request flow

```text
Browser → proxy (cookie check)
        → Next.js Server Component → NestJS JWT guard → Drizzle → PostgreSQL
        → React rendering

Client Component form/button → Next.js /api/* → NestJS access control → Drizzle → PostgreSQL
Cover image upload → Next.js /api/backend → NestJS saves to pj-be/uploads
Image display → Next.js /uploads/* → backend image file
```

Sign-in and registration set an HttpOnly session cookie containing a JWT valid for seven days. Protected NestJS endpoints validate the token and current account status. Users see approved catalog content; owners submit pending content, which becomes visible after admin approval.

Users claim vouchers into `/me` and use each voucher once when booking from its detail page. City filtering uses `?city=ha-noi`. Language switching changes the `/vi` or `/en` prefix.

Private configuration files such as backend `.env` and frontend `.env.local` are omitted from the tree to distinguish them from committed templates. `next-env.d.ts`, `tsconfig.tsbuildinfo`, `.next`, `.test-dist`, and `dist` are generated files or directories. PostgreSQL data is stored outside the source tree.

See [TEAM_GUIDE.md](TEAM_GUIDE.md) for feature details, related files, and a demo walkthrough.
