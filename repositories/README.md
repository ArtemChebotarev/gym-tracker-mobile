# repositories

Repository contracts (interfaces). Implementations live in `storage`. No business logic — only read, write, filtering, and assembling trees of related entities.

See 07 · Persistence Layer Contract, "Hard rules" and "Repositories and their operations" sections.

The contracts here are executable: `__tests__/contracts/` holds a test suite written against
these interfaces alone, which any implementation is run through by handing it a factory (task
109). Add an operation here, add its expectations there.

Every stored record carries `createdAt` / `updatedAt` (`domain/timestamps.ts`). The adapter writes
them, so `create` takes an `Incoming<T>` — the entity without stamps, or with its own when a
restore puts back records that already existed — and returns the stored `T`; `update` takes the
stored entity, moves `updatedAt` and keeps `createdAt` as it was.

