# storage

Storage adapter: implements the interfaces from `repositories` on top of local storage (later — HTTP). Errors are normalized into domain types (NotFound, ConflictError, StorageUnavailable).

See 07 · Persistence Layer Contract, "Hard rules" section.

Tested twice over: the shared repository contract in `__tests__/contracts/` (every implementation
must pass it — this adapter is put through it by `__tests__/storage/inMemoryContract.test.ts`),
plus the tests beside it for what is this engine's own business — its collections, cloning,
transaction rollback, and behaviour on rows a relational adapter could not produce.
