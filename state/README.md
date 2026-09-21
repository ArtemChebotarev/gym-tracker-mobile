# state

State layer: TanStack Query for reading and writing data through `usecases` (queries for reads, mutations for writes), and a Zustand store for drafts that survive navigation between screens.

See 07 · Persistence Layer Contract, "Layers" section.

## Where the repositories come from

`bootstrap.ts` brings the one `RepositorySet` the app reads through up at startup: open the
SQLite database, apply the migrations this build carries (069, which is also what puts the
exercise catalog in it — 067(2)), then hand it over. `components/StorageGate.tsx` is what it is
handed to — the gate holds the splash and mounts no screen until the bootstrap has settled (task
111), and then renders the `RepositoriesProvider` of `repositories.tsx` around everything below
(task 115). Nothing reads storage any other way: `useRepositories()` throws when there is no
provider above it, so a screen that somehow rendered outside the gate fails loudly instead of
showing empty lists.

`exerciseLibraryStore.ts`, `mesocycleStore.ts`, `workoutStore.ts` and `backupStore.ts` are the
composition roots: which repositories of that set each use case reads through. They are hooks,
because that is how the set is reached — but what they hand to `usecases/` is still a plain narrow
`Deps` object, and nothing below `state/` knows React exists.

A test renders its own set instead — one per test, through `withRepositories()` in
`__tests__/fixtures/renderWithRepositories.tsx`.

Nothing here seeds anything any more (task 112). The catalog arrives as a migration, and
mesocycles arrive because the user made them — a clean install starts with an empty list, and
the stub mesocycles are a test fixture (`__tests__/fixtures/mesocycleMocks.ts`).
