# storage

Storage adapter: implements the interfaces from `repositories` on top of local storage (later — HTTP). Errors are normalized into domain types (NotFound, ConflictError, StorageUnavailable).

See 07 · Persistence Layer Contract, "Hard rules" section.
