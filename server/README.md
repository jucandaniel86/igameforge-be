# iGameForge backend

NestJS 12 REST API with native ESM, npm, TypeScript and Prisma 7. Node 22.12+ on the 22 line (verified on 22.16.0), or Node 24+. npm 10+. No global CLI is required.

## Getting started

```sh
npm ci
cp .env.example .env
# Set DATABASE_URL and replace JWT_SECRET with a strong random secret.
npm run prisma:generate
npm run start:dev
```

API: `http://localhost:3001/api/health` → `{"status":"ok"}`. Swagger UI: `/docs`; OpenAPI JSON: `/docs-json`. Restrict documentation access at your ingress if necessary for production.

Configure allowed frontend origins in `.env` using `CORS_ORIGINS`, for example
`CORS_ORIGINS=http://localhost:3000,https://app.example.com`. Use origins only
(scheme, host and port), without URL paths or trailing slashes. Restart the backend
after changes. CORS is enabled globally in `src/common/setup-app.ts`; the default
origin is defined in `src/config/validate-env.ts`.

## Structure

- `src/app.module.ts`: global environment configuration and scheduler registration.
- `src/auth/`: Passport and JWT module configuration, ready for future users, strategy and guards. No authentication endpoints or route protection yet. Swagger's bearer scheme only documents authentication.
- `src/health/`: controller/module and unit test.
- `src/config/`: startup validation for database URL, JWT secret and port.
- `src/prisma/`: injectable PrismaService exported by PrismaModule. Import PrismaModule in features that need database access.
- `src/scheduled/`: module with Axios (10-second timeout) and Prisma imports; add scheduled providers here using `@Cron` when requirements are known.
- `src/common/`: shared application setup (validation and shutdown hooks).
- `prisma/`: empty schema and future migrations; `prisma.config.ts` configures CLI connection settings.
- `test/`: HTTP integration tests against the application module.

Prefer a module per feature as the API grows, keeping controllers, services and DTOs inside that feature. Use concrete DTO classes with class-validator decorators; the global pipe transforms input, rejects unknown fields and validates constraints. Internal ESM imports use `.js` extensions even in TypeScript.

## Database

PostgreSQL is the initial provider; no application models or migrations exist. If the Laravel database uses a different engine, change the Prisma datasource, driver adapter and URL validation before defining models or introspecting it. Do not run migrations against an existing database without a migration/baselining plan.

Prisma uses lazy connections: boot and `/health` work without a running database. `/health` is a liveness endpoint, not a database readiness check. Once queries exist, connection errors surface on database operations. Shutdown disconnects the client and closes its pool.

After adding models:

```sh
npm run prisma:generate
npm run prisma:migrate -- --name initial
```

Generation must run before building a fresh checkout. Generated client files are ignored. For deployment, install build dependencies, generate, build, and then prune development dependencies if desired. Run `npm run prisma:deploy` in the release stage once migrations exist. Supply environment variables through your deployment platform; never commit `.env`.

## Commands

```sh
npm run build
npm run start:prod
npm test
npm run test:e2e
npm run test:cov
npm run prisma:studio
```

The build uses TypeScript directly; development uses tsc-watch and restarts Node after a successful compilation, preserving decorator metadata. Tests use Jest, ts-jest, Nest's TestingModule and Supertest. Node's VM modules flag enables Jest ESM support and may print an experimental warning.

## Version compatibility

Node and npm were checked before installation: 22.16.0 and 10.9.2. NestJS 12 and Prisma 7.10.1 support this runtime. Prisma 8's registry release candidate requires Node 22.18+ and was intentionally excluded. Nest schematics currently need a newer Node patch, so this project uses a direct TypeScript build rather than the scaffolding CLI. `engine-strict` prevents unsupported dependency engines; the lockfile records the resolved dependency tree. No force or legacy-peer-deps flags were used.

Scheduled tasks run in every application instance by default. Before adding a synchronization job in a multi-instance deployment, arrange a single scheduler instance or a database lock. No external requests or business jobs run in this scaffold.
