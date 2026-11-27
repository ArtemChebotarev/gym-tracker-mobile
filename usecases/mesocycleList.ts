// Mesocycles-list use cases — task 074 (08.3 · Мезоциклы — список). Orchestration only, per
// usecases/README.md: reading every mesocycle for the list, deleting one, and archiving a finished
// one.
//
// The two ways a finished block leaves the list are deliberately not the same thing (GT-268).
// Archive only hides it (`archivedMesocycle`): the rows stay where they are, so its sets keep
// showing in exercise history and keep feeding the targets of the next block. Delete removes the
// block and everything logged in it, for a block whose numbers are wrong — a first cycle logged
// with made-up weights would otherwise steer every target after it. A `planned` block has no
// history, so for it Delete is the only way out.

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
 * Permanently deletes mesocycle `id` with every session, session exercise, set log and round log
 * under it, in one transaction (`deleteWithChildren`; 08.3: no trash, no safe delete). A planned
 * block has none of those yet; a finished or stopped one (GT-268, Artem's approval 27.11.2026)
 * takes its whole history with it, so exercise history and the targets of later blocks stop
 * seeing those sets.
 *
 * Rejects with `NotFoundError` if `id` doesn't exist, or `ConflictError` if the block is `active`
 * — it is ended (Stop) before it can go, and the list offers Delete on Planned and Completed rows
 * only, so an active one reaching here is a bug, not a user action to honor. Nothing is deleted then.
 */
export async function deleteMesocycle(id: string, deps: MesocycleListDeps): Promise<void> {
  const existing = await deps.mesocycleRepo.getById(id);
  if (!existing) {
    throw new NotFoundError(`Mesocycle "${id}" does not exist.`);
  }
  if (existing.status === 'active') {
    throw new ConflictError(`Mesocycle "${id}" is active; stop it before deleting it.`);
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
