import { execFileSync } from 'node:child_process';

// `npm run migration <name>` — the only way a schema migration gets generated in this project.
//
// It is a thin wrapper around `drizzle-kit generate --name <name>`, and its whole job is to make
// the name non-optional. Run bare, drizzle-kit invents one (`0002_remarkable_smasher`), and the
// obvious next move — delete it, generate again with a better name — is the one move that must
// never happen: drizzle-kit stamps every `generate` with the moment it ran, and that stamp, in
// `drizzle/meta/_journal.json`, *is* the schema version a database records for that migration.
//
// So regenerating is not a rename. It produces a different migration carrying the same SQL, and
// any database that already applied the first one sees a migration it has never run and runs the
// DDL a second time. On 25.09.2026 that took down the app on the simulator — `ALTER TABLE
// mesocycle ADD archived_at` against a table that already had the column, `StorageUnavailableError`
// at startup, no way in. The fix was restoring the original stamp, because a migration that has
// run anywhere real is frozen (AGENTS.md).
//
// Naming it up front costs nothing and removes the temptation entirely. This is what EF Core's
// `dotnet ef migrations add <Name>` has always required, for the same reason.
//
// Reference data — the exercise catalog — has its own generator, `npm run catalog:migration`
// (scripts/generateCatalogMigration.ts): drizzle-kit can diff tables but not rows.

const USAGE = `Usage: npm run migration <name>

  <name>  what the migration does, in snake_case — e.g. mesocycle_archived_at

Change storage/sqlite/schema.ts first; this generates the migration for that change.
Never delete a generated migration to regenerate it under a nicer name — see the note at the
top of this file, and AGENTS.md.`;

/** snake_case, so a generated filename reads like the ones already in `drizzle/`. */
const NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

const name = process.argv[2];

if (name === undefined || name === '') {
  console.error(`A migration needs a name.\n\n${USAGE}`);
  process.exit(1);
}

if (!NAME_PATTERN.test(name)) {
  console.error(`"${name}" is not a usable migration name — snake_case only.\n\n${USAGE}`);
  process.exit(1);
}

execFileSync('npx', ['drizzle-kit', 'generate', '--name', name], { stdio: 'inherit' });
