# Authentication sessions

The existing JWT access guard remains stateless. Login still accepts `{ email,
password }` and returns `{ success: true, data: { access_token } }`. Access tokens
are held in frontend memory. Refresh tokens are sent only through the host-only
`refresh_token` cookie, never in the JSON response or browser storage.

## Configuration

Set these backend environment variables before startup:

```dotenv
JWT_SECRET=<existing-access-secret>
JWT_ACCESS_EXPIRES_IN=30m
JWT_REFRESH_SECRET=<different-cryptographically-random-secret-at-least-32-characters>
JWT_REFRESH_EXPIRES_IN=7d
JWT_REFRESH_COOKIE_SAME_SITE=lax
CORS_ORIGINS=http://localhost:3000
```

The local refresh secret was generated only if absent; the existing access secret
was preserved. Do not commit `.env`. Supply a separate production refresh secret
through the deployment secret manager. Changing it invalidates existing refresh
JWTs. Duration configuration accepts positive integers followed by `s`, `m`, `h`
or `d`.

Cookies are HttpOnly, expire explicitly, and are restricted to `/api/auth`.
`NODE_ENV=production` enables Secure. The frontend API URL must include `/api`.
Deploy frontend and API on the same site where possible (different ports or
same-site subdomains work). For genuinely cross-site deployments, set SameSite
`none` with production HTTPS and verify browser third-party-cookie policies;
browser blocking may require a same-site API proxy. Do not switch tokens to
localStorage. Configure exact frontend origins in CORS; do not use `*`.

Login, refresh and logout require `X-Auth-Request: 1`. The frontend sends it
already. This non-simple custom header requires a browser preflight; the guard
also rejects any Origin outside CORS_ORIGINS. Reverse proxies must preserve this
header and must not cache authentication responses. Non-browser API clients
must include the header too. Credentialed cross-origin requests are enabled by
the existing CORS setup.

## Endpoints and storage

- `POST /api/auth/login`: verifies the existing password format, creates a
  separate session per login, sets a refresh cookie, returns the access JWT.
- `GET /api/auth/me`: retains its existing access guard and user/roles/permissions
  response.
- `POST /api/auth/refresh`: verifies refresh JWT signature, expiration and type,
  reads the session, and rotates its SHA-256 token hash using a conditional atomic
  update. A replay revokes that session. Rotation keeps the original session's
  absolute seven-day expiry; it does not extend the session indefinitely.
- `POST /api/auth/logout`: verifies the refresh cookie even when its JWT has
  expired, revokes the identified session, and clears the cookie. Missing,
  invalid, already-revoked tokens produce an idempotent response. No valid access
  token is needed. Database failures are not reported as successful revocation.

Only token hashes are stored in `auth_sessions`, with the user ID, creation time,
expiry and revocation time. Access tokens issued before logout can still work
until their 30-minute expiration. Other logins for that user are unaffected.
Expired/revoked rows can be purged under a separate retention policy; the expiry
index supports cleanup. No unrelated scheduler was added.

## Frontend behavior

GET, POST and DELETE wrappers share one authenticated transport. On an expired
(or missing) access token's 401 response, it refreshes once and retries the
original request once with its body, query, headers and response type preserved.
Unexpired-token 401s and 403s do not trigger repeated refresh. Refresh/login/logout
use raw fetch with automatic retries disabled, so they cannot recursively refresh.

Simultaneous requests share one in-flight refresh operation. Web Locks also
serialize cookie rotation across tabs where supported; the fallback serializes
requests within each tab. Unsupported browsers can revoke the session if two
separate tabs race to rotate the same token; re-login is required in that case.

A startup plugin awaits cookie-based restoration and `/auth/me`; route middleware
waits for it before redirecting. The old persisted `auth-store` is removed and
Pinia auth persistence is disabled. Login once after upgrading: old access-only
sessions have no refresh cookie to restore.

Logout clears user, roles, permissions, memory tokens and the legacy store even
when the network fails. Late refresh/profile responses cannot restore local
identity. A tab-scoped signed-out marker prevents immediate cookie restoration
following an offline logout. The UI warns that server revocation failed; the
cookie may still represent an active server session until expiry or successful
revocation. Closing the tab removes that tab-scoped marker.

## Migration and verification

Migration `20261026154757_add_auth_sessions` creates only the session table,
indexes and its user foreign key. Applied locally after verifying the previous
migration checksums and reviewing the generated SQL. All original application
table definitions and row counts were checked unchanged. No existing sessions
were removed. The unrelated Role timestamp default and pending Game indexes in
the schema were excluded; future migration generation may still propose them.

Commands:

```sh
# server
./node_modules/.bin/prisma format
./node_modules/.bin/prisma validate
./node_modules/.bin/prisma generate
npm run build
npm test -- --runInBand src/auth/auth.service.spec.ts
./node_modules/.bin/prisma migrate status

# frontend
npm run test:auth
npm run build
```

HTTP tests cover JWT lifetimes, cookie transport, response compatibility, guarded
routes, rotation/replay, logout and CSRF. Frontend tests cover concurrent retries,
reload restoration, offline logout and late responses. A local real-database smoke
check exercised a temporary session through rotation and logout, then removed
only that temporary session. A manual production-browser check is still needed
for the deployment's HTTPS, origins and cookie policy.

## Files in this change

Backend: `src/auth/auth.controller.ts`, `auth.module.ts`, `auth.service.ts`,
`auth.config.ts`, `auth.service.spec.ts`, `guards/auth-origin.guard.ts`,
`strategies/jwt.strategy.ts`, this README, `src/config/validate-env.ts`,
`.env.example`, local ignored `.env`, `prisma/schema.prisma`, and
`prisma/migrations/20261026154757_add_auth_sessions/migration.sql`.
Generated Prisma Client files are regenerated artifacts.

Frontend: `store/auth.ts`, `utils/auth-request.ts`,
`composables/useAuthRequest.ts`, `useApiFetch.ts`, `useApiPostFetch.ts`,
`useApiDeleteFetch.ts`, `plugins/auth.client.ts`, `middleware/auth.ts`,
`pages/login/index.vue`, `components/layouts/top/index.vue`,
`test/auth-session.test.mjs`, and the `test:auth` script in `package.json`.

Final focused results: 9 backend tests and 12 frontend tests passed. Both
production builds passed. Prisma Client generation and migration status passed;
all eight migrations are applied in the local database. Browser interactions
were tested through HTTP and store/transport tests, not a graphical browser.
