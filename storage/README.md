# storage

Storage adapter: implements the interfaces from `repositories` on top of local storage (later — HTTP). Errors are normalized into domain types (NotFound, ConflictError, StorageUnavailable).

See 07 · Persistence Layer Contract, "Hard rules" section.

Tested twice over: the shared repository contract in `__tests__/contracts/` (every implementation
must pass it — this adapter is put through it by `__tests__/storage/inMemoryContract.test.ts`),
plus the tests beside it for what is this engine's own business — its collections, cloning,
transaction rollback, and behaviour on rows a relational adapter could not produce.

Which engine the tests run on (task 110): repository behaviour is checked through the contract on
whatever implementation a runner supplies, and the SQLite implementation (task 067) is driven in
Jest by `better-sqlite3` rather than by `expo-sqlite`, which is a native iOS/Android module and
cannot load in Node. Same engine, same SQL, same schema and migrations — only the line that opens
the database differs from the app's. The database is `:memory:` and built fresh per test, so there
is nothing to clean up between tests and no shared state to leak. What a Node driver cannot prove
is how the native binding behaves on a phone; that stays a manual check on the simulator (task
111). `__tests__/storage/sqliteToolchain.test.ts` is the standing proof that this toolchain works
under Jest.

