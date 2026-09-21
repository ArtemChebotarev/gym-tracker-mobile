# storage

Storage adapters: implementations of the interfaces from `repositories` on top of local storage
(later — HTTP). Errors are normalized into domain types (NotFound, ConflictError,
StorageUnavailable).

See 07 · Persistence Layer Contract, "Hard rules" section.

## One implementation (task 118)

`sqlite/` is the **SQLite** engine (task 067) and what the app runs on since task 111: the
repositories over Drizzle ORM, with the relational schema in `sqlite/schema.ts` and the generated
DDL in `drizzle/`. `createSqliteRepositories` is its one factory, producing the `RepositorySet`
of `repositories/repositorySet.ts`; `state/bootstrap.ts` builds it at startup and
`components/StorageGate.tsx` puts it into context for everything below (task 115), so another
engine would be that one call and nothing else.

There used to be a second engine here — an in-memory one, `InMemoryStore` plus a repository per
entity, kept as a test double after 111. Task 118 removed it: it was another adapter to write for
every transactional store, and a test over it could describe states the database refuses (a
session exercise naming an exercise nobody has, a set log with no session exercise). The tests
run on `better-sqlite3` `:memory:` instead — `__tests__/fixtures/sqliteDatabase.ts` opens a
migrated database per test, in a fraction of a millisecond, with the foreign keys on.

The five files directly in this directory are what both engines shared and `sqlite/` still uses:
`async.ts` (rule 1's artificial asynchrony), `errors.ts` (the domain error types), `timestamps.ts`
(rule: the adapter stamps), `settingsDefaults.ts`, and `muscleGroupRepository.ts` — a fixed enum
with nothing stored, so no engine can differ about it.

What belongs where inside `sqlite/`: `schema.ts` is the tables, `mappers.ts` the entity ↔ row
translation (the one place `NULL` and an absent field meet), `errors.ts` the normalization of
driver failures, `transaction.ts` the BEGIN/COMMIT/ROLLBACK that rule 6 needs — Drizzle's own
`transaction()` cannot be used because it commits when a synchronous callback returns, and every
repository method is async. `repositories.ts` wires all fourteen over one database handle.

## Migrations and the schema version (task 069)

`migrations.ts` brings a database up to the schema this build expects, and refuses one written by
a newer build. There is no schema version anyone maintains: `drizzle-kit generate` stamps each
migration with its generation time in `drizzle/meta/_journal.json`, Drizzle's migrator records the
stamps it has applied in a `__drizzle_migrations` table inside the user's database, and applies
whatever is newer. A database whose newest stamp is newer than anything this build carries came
from a later version of the app — migrating forward cannot help, so opening it is refused with
`StorageUnavailableError`.

Getting the migrations into the app takes two pieces of build configuration, because Metro has no
filesystem to read them from at runtime: `metro.config.js` adds `.sql` as a source extension, and
`babel.config.js` inlines each `.sql` import as a string (without it Babel would try to parse SQL
as JavaScript). `migrationBundle.ts` is the single place that imports the generated
`drizzle/migrations.js`. `state/bootstrap.ts` is what runs them, once, before any screen mounts
(task 111).

`drizzle/` is generated. Never hand-edit a migration that has shipped: a database that already
applied it will not apply it again. `0000_initial_schema.sql` was edited by hand once, in task
111, to drop a `catalog_version` column nobody read — the last moment that was safe, since no
build had yet run on a device and so no database had ever applied it.

## The exercise catalog (task 067(2))

The catalog ships as a migration too, not as a step at startup: `drizzle/0001_seed_catalog.sql`
is one upsert carrying every exercise. It is reference data with ids baked into the app, so the
journal that decides whether a schema change has been applied decides the same for catalog
content, and there is no second version number to keep in step by hand.

Change `domain/exerciseCatalog.ts`, then run `npm run catalog:migration` — it asks drizzle-kit
for an empty custom migration and writes the whole catalog into it. `scripts/catalogMigration.ts`
explains why it emits the entire catalog rather than a difference, and which columns a re-seed is
allowed to overwrite: never `is_hidden`, which is the user's, and never `created_at`.

Drizzle cannot generate this itself — its snapshot models tables and columns and has no notion of
rows, so `generate` has nothing to diff. `generate --custom` is its supported hook for exactly
this, and that is what the script drives.

One test guards the whole arrangement: after migrating, the catalog in the database must equal
`EXERCISE_CATALOG`. Edit the catalog without generating a migration and it fails.

`MuscleGroupCatalogRepository` sits outside `sqlite/` rather than inside it: muscle groups are a
fixed enum in the domain (02 · Domain Model), so there is nothing stored for an engine to differ
about.

## Tests

Tested twice over: the repository contract in `__tests__/contracts/` (any implementation must
pass it unchanged — `sqliteContract.test.ts` is its runner), plus the tests beside it for what is
this adapter's own business: its error normalization, its cleared columns and its nested
transactions. The contract had a second runner over the in-memory engine until task 118; with one
implementation left it states what the next one would have to satisfy.

Which engine the tests run on (task 110): repository behaviour is checked through the contract on
whatever implementation a runner supplies, and the SQLite implementation (task 067) is driven in
Jest by `better-sqlite3` rather than by `expo-sqlite`, which is a native iOS/Android module and
cannot load in Node. Same engine, same SQL, same schema and migrations — only the line that opens
the database differs from the app's. The database is `:memory:` and built fresh per test, so there
is nothing to clean up between tests and no shared state to leak. What a Node driver cannot prove
is how the native binding behaves on a phone; that stays a manual check on a device. The one line
that differs there is `sqlite/expoDatabase.ts`, which opens the app's own database file. `__tests__/storage/sqliteToolchain.test.ts` is the standing proof that this toolchain works
under Jest.

