# Repository Guidelines

## Project Structure & Module Organization

This is a two-package TypeScript project. `pj-fe/src/app/` contains Next.js routes; `[locale]/` serves Vietnamese (`vi`) and English (`en`). Small interactive components live in `pj-fe/src/components/`, and server API access lives in `pj-fe/src/lib/api.ts`. `pj-be/src/core/` contains NestJS controllers, DTOs, authentication, the Drizzle schema, and database setup. `pj-be/drizzle/20260924_restructure.sql` is the active migration. Keep API response fields aligned between packages.

## Build, Test, and Development Commands

Use Node.js 20+ and run `npm ci` separately in both packages. From `pj-be/`, run `npm run db:migrate` to create or upgrade the schema and seed demo accounts, then `npm run start:dev` for the API on port 8081. From `pj-fe/`, run `npm run dev` for the UI on port 3000. Both packages support `npx tsc --noEmit`, `npm run build`, and `npm run lint`. Backend `npm test -- --runInBand` runs Jest validation tests. `npm run test:smoke` exercises real API roles and cleans its test records; start PostgreSQL and the API first.

## Coding Style & Naming Conventions

Use strict TypeScript without `any`. Backend code uses two-space indentation, single quotes, and Prettier; format changed backend files with `npx prettier --write src/core/*.ts`. Keep DTO validation decorators on request bodies and Swagger decorators on every endpoint. Name React components in PascalCase. Use Server Components for read-only pages and Client Components only for forms, navigation, and mutations.

## Testing Guidelines

Name Jest files `*.spec.ts` under `pj-be/src/`. Add tests for behavior with meaningful failure cases. For UI changes, run frontend type checking, lint, and production build, then manually check the affected route. Verify role restrictions and approval visibility with the smoke test when changing auth or catalog logic.

## Commit & Pull Request Guidelines

Recent commits use concise conventional subjects such as `feat(ui):`, `fix:`, `docs:`, and `chore:`. Describe behavior in a pull request, list verification commands, link related issues, and include screenshots for visible UI changes. Never commit `.env` files or real credentials; update `.env.example` instead.
