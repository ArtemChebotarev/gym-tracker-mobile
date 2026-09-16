// Mesocycles-list use cases — task 074 (08.3 · Мезоциклы — список). Orchestration only, per
// usecases/README.md: reading every mesocycle for the list, and deleting a planned one.

import { ConflictError, NotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import type { MesocycleRepository } from '@repositories/mesocycle';

export type MesocycleListDeps = {
  mesocycleRepo: MesocycleRepository;
};

/** Every mesocycle, in any status — grouping for display is the screen's job. */
export async function listMesocycles(deps: MesocycleListDeps): Promise<Mesocycle[]> {
  return deps.mesocycleRepo.getAll();
}

/**
 * Permanently deletes a planned mesocycle (08.3, "`⋯` — меню Planned": no trash, no safe delete).
 * Rejects with `NotFoundError` if `id` doesn't exist, or `ConflictError` if it isn't `planned` —
 * the list only offers Delete on Planned rows (08.3: deleting a Completed one is deliberately not
 * offered), so anything else reaching here is a bug, not a user action to honor.
 */
export async function deletePlannedMesocycle(id: string, deps: MesocycleListDeps): Promise<void> {
  const existing = await deps.mesocycleRepo.getById(id);
  if (!existing) {
    throw new NotFoundError(`Mesocycle "${id}" does not exist.`);
  }
  if (existing.status !== 'planned') {
    throw new ConflictError(
      `Mesocycle "${id}" is ${existing.status}; only planned ones can be deleted.`,
    );
  }
  await deps.mesocycleRepo.deleteWithChildren(id);
}
