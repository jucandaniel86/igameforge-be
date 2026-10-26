# Migration history repair — 2026-10-26

`20261023160000_add_user_role` actually ran on the local database at
2026-10-23 15:19:35 UTC, before `20261023153318_add_users_roles` ran at
15:33:18 UTC. Its original directory timestamp reversed that dependency during
shadow replay: the latter migration dropped a foreign key that did not yet exist.

The directory was renamed to `20261023151935_add_user_role`, and the existing
local `_prisma_migrations` entry's `migration_name` was changed to the same name.
The SQL, migration record ID, execution timestamps and SHA-256 checksum were
preserved. No migration was marked applied or rolled back, and no application
table was changed by this repair. The user confirmed these migrations had only
been applied locally. The corrected history was replayed in an isolated shadow
database and produced an empty schema diff against the existing database.

The preserved checksum for the renamed SQL is:

```text
41068218f3a8eab71b505a9f97db95af3ee0fcdacf7da0874cb9be634de8c45e
```

## Cron migration

`20261026151818_add_crons_table` was generated with `migrate dev --create-only`
from the existing schema and reviewed before application. It creates only
`crons`. It is intentionally left pending following the user's prepare-only
instruction. To apply this reviewed migration, run from `server`:

```sh
npx prisma migrate deploy
npx prisma generate
npx prisma migrate status
```

Check for additional pending migrations before deploying; `migrate deploy`
applies all pending migrations.

## Remaining schema difference

`Role.createdAt` declares `@default(now())`, but the existing database column
`roles.created_at` has no default. The user requested that `roles` remain
untouched. The generated `ALTER TABLE roles` statement was therefore removed
from the new, unapplied Cron migration. No models or enums were changed.

This is a difference between the desired Prisma schema and the migration/database
state, not drift between the repaired history and the existing database. Future
`migrate dev` runs will propose the timestamp-default change again. Resolve it
explicitly in a separately reviewed migration, or change the Prisma default only
with authorization. Do not reset the database or hide it with migration metadata.
