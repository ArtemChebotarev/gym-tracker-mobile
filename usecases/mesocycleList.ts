// Mesocycles-list use cases — task 074 (08.3 · Мезоциклы — список). Orchestration only, per
// usecases/README.md: reading every mesocycle for the list, deleting a planned one, and archiving
// a finished one.
//
// The two ways a block leaves the list are deliberately not the same thing. A `planned` block has
// no history, so Delete really deletes it; a finished one is training that happened, so Archive
// only hides it (`archivedMesocycle`) and the rows stay where they are.

import { ConflictError, NotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import { archivedMesocycle } from '@domain/mesocycleLifecycle';
import { nowAsUtcIso } from '@domain/time';
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

/**
 * Archives mesocycle `id` — a soft delete: `archivedAt` is stamped and nothing else moves. No
 * cascade, by design (Artem, 25.09.2026): the block's sessions, exercises and set logs stay
 * exactly as they are, and the block simply stops being listed (`finishedMesocyclesNewestFirst`).
 *
 * Rejects with `NotFoundError` if `id` doesn't exist, and with `ConflictError` if the block hasn't
 * ended or is archived already — the list offers Archive on Completed rows only, so anything else
 * reaching here is a bug rather than a user action to honor. Nothing is written then.
 */
export async function archiveMesocycle(
  id: string,
  deps: MesocycleListDeps,
  now: string = nowAsUtcIso(),
): Promise<Mesocycle> {
  const existing = await deps.mesocycleRepo.getById(id);
  if (!existing) {
    throw new NotFoundError(`Mesocycle "${id}" does not exist.`);
  }
  return deps.mesocycleRepo.update(archivedMesocycle(existing, now));
}
