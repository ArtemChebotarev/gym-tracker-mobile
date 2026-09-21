# state

State layer: TanStack Query for reading and writing data through `usecases` (queries for reads, mutations for writes), and a Zustand store for drafts that survive navigation between screens.

See 07 · Persistence Layer Contract, "Layers" section.

## Where the repositories come from

`repositories.ts` holds the one `RepositorySet` the app reads through, and `bootstrap.ts` puts it
there at startup: open the SQLite database, apply the migrations this build carries (069, which is
also what puts the exercise catalog in it — 067(2)), then install. Until that has happened,
reading storage throws rather than answering, and `components/StorageGate.tsx` is what makes it
unreachable — it holds the splash and mounts no screen until the bootstrap has settled (task 111).

`exerciseLibraryStore.ts`, `mesocycleStore.ts` and `workoutStore.ts` are the composition roots:
which repositories of that set each use case reads through. They are functions rather than
objects because expo-router imports every route, and with it every one of these modules, before
the bootstrap has run.

Nothing here seeds anything any more (task 112). The catalog arrives as a migration, and
mesocycles arrive because the user made them — a clean install starts with an empty list, and
the stub mesocycles are a test fixture (`__tests__/fixtures/mesocycleMocks.ts`).
