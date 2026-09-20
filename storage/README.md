# storage

Storage adapters: implementations of the interfaces from `repositories` on top of local storage
(later — HTTP). Errors are normalized into domain types (NotFound, ConflictError,
StorageUnavailable).

See 07 · Persistence Layer Contract, "Hard rules" section.

## Two implementations

The files in this directory are the **in-memory** engine (`InMemoryStore` plus one repository per
entity), which is what the app still runs on. `sqlite/` is the **SQLite** one (task 067): the
same repositories over Drizzle ORM, with the relational schema in `sqlite/schema.ts` and the
generated DDL in `drizzle/`.

The SQLite adapter is complete and tested but not yet wired to anything — `state/appStore.ts`
still builds the in-memory repositories, and the app keeps using them. Opening the database on
the device, running migrations at startup and switching the app over are tasks 069 and 111; until
then nothing in `app/` or `state/` imports `sqlite/`.

What belongs where inside `sqlite/`: `schema.ts` is the tables, `mappers.ts` the entity ↔ row
translation (the one place `NULL` and an absent field meet), `errors.ts` the normalization of
driver failures, `transaction.ts` the BEGIN/COMMIT/ROLLBACK that rule 6 needs — Drizzle's own
`transaction()` cannot be used because it commits when a synchronous callback returns, and every
repository method is async. `repositories.ts` wires all twelve over one database handle.

`MuscleGroupCatalogRepository` is shared by both adapters rather than duplicated: muscle groups
are a fixed enum in the domain (02 · Domain Model), so there is nothing stored for an engine to
differ about.

## Tests

Tested twice over: the shared repository contract in `__tests__/contracts/` (every implementation
must pass it, unchanged — `inMemoryContract.test.ts` and `sqliteContract.test.ts` are the two
runners), plus the tests beside those for what is one engine's own business — the in-memory
collections, cloning and rows a relational adapter could not produce; SQLite's error
normalization, its cleared columns and its nested transactions.

Which engine the tests run on (task 110): repository behaviour is checked through the contract on
whatever implementation a runner supplies, and the SQLite implementation (task 067) is driven in
Jest by `better-sqlite3` rather than by `expo-sqlite`, which is a native iOS/Android module and
cannot load in Node. Same engine, same SQL, same schema and migrations — only the line that opens
the database differs from the app's. The database is `:memory:` and built fresh per test, so there
is nothing to clean up between tests and no shared state to leak. What a Node driver cannot prove
is how the native binding behaves on a phone; that stays a manual check on the simulator (task
111). `__tests__/storage/sqliteToolchain.test.ts` is the standing proof that this toolchain works
under Jest.

