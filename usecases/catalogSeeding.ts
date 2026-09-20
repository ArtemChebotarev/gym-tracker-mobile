import type { Exercise } from '@domain/catalog';
import type { Unsaved } from '@domain/timestamps';
import type { ExerciseRepository } from '@repositories/catalog';
import type { SettingsRepository } from '@repositories/settings';

// Task 067(2) · seeding the exercise catalog by `catalogVersion` (02 · Domain Model,
// "catalogVersion"). Orchestration only, per usecases/README.md: the decision of *what* gets
// inserted belongs to the repository, which matches on the catalog's baked-in ids and leaves
// every record it already holds alone; this decides *whether* there is anything to do at all.

/** The catalog a build ships, with the version that identifies it. */
export type CatalogRelease = {
  version: number;
  exercises: readonly Unsaved<Exercise>[];
};

export type CatalogSeedingDeps = {
  exerciseRepo: ExerciseRepository;
  settingsRepo: SettingsRepository;
};

/**
 * Brings the stored catalog up to `release`, and resolves to whether it had to. A store already
 * at that version — every launch after the first one on a given build — is left untouched, which
 * is the point of the version: without it, every start would walk all eighty-odd catalog ids to
 * conclude that nothing is missing.
 *
 * A store at a *newer* version is also left alone. That happens when someone updates the app,
 * uses it and rolls back: the catalog then holds exercises this build has never heard of, and
 * they are not this build's to remove — just as a newer database is not its to migrate
 * (storage/sqlite/migrations.ts).
 *
 * Seeding first and recording the version second is deliberate, and makes a transaction across
 * the two unnecessary: a failure between them leaves the version behind the catalog, so the next
 * launch simply seeds again — and seeding is idempotent. The other order would leave a store
 * claiming a version it never received.
 */
export async function seedExerciseCatalog(
  release: CatalogRelease,
  deps: CatalogSeedingDeps,
): Promise<boolean> {
  const settings = await deps.settingsRepo.read();
  if (settings.catalogVersion >= release.version) {
    return false;
  }
  await deps.exerciseRepo.seedCatalog(release.version, release.exercises);
  await deps.settingsRepo.write({ ...settings, catalogVersion: release.version });
  return true;
}
