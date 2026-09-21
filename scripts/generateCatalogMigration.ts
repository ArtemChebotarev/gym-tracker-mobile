import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { EXERCISE_CATALOG } from '../domain/exerciseCatalog';
import { nowAsUtcIso } from '../domain/time';
import { catalogUpsertSql } from './catalogMigration';

// `npm run catalog:migration [name]` — see scripts/catalogMigration.ts for what this writes and
// why the catalog ships as a migration at all.
//
// Two steps: ask drizzle-kit for an empty custom migration, which numbers it and records it in
// the journal, then write the catalog into the file it made. Every run produces a *new*
// migration; an applied one is never rewritten, because a phone that already ran it would never
// see the change.

const MIGRATIONS_DIR = 'drizzle';

const name = process.argv[2] ?? 'catalog';

execFileSync('npx', ['drizzle-kit', 'generate', '--custom', '--name', name], {
  stdio: 'inherit',
});

const journal = JSON.parse(readFileSync(join(MIGRATIONS_DIR, 'meta/_journal.json'), 'utf8')) as {
  entries: { tag: string }[];
};
const latest = journal.entries.at(-1);
if (!latest) {
  throw new Error('drizzle-kit produced no migration to write the catalog into.');
}

const file = join(MIGRATIONS_DIR, `${latest.tag}.sql`);
writeFileSync(file, catalogUpsertSql(EXERCISE_CATALOG, nowAsUtcIso()));
console.log(`Wrote ${EXERCISE_CATALOG.length} catalog exercises into ${file}`);
