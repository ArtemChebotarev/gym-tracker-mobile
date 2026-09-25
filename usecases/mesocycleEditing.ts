// Mesocycle editing use cases — changes to a mesocycle's own record, as opposed to the sessions
// under it:
//
// - `editPlannedMesocycle` — task 072 (04 · Meso Creation Flows, "Сохранение при подтверждении
//   (Confirm)": a planned mesocycle stays fully editable until Start; 08.3 · Мезоциклы — список,
//   `⋯` → Edit). The whole draft goes back, and only while the block is still `planned`.
// - `renameMesocycle` — task 087 (05 · Workout Execution & Logging, "Переименовать мезоцикл").
//   The name alone, in any status.
//
// Orchestration only, per usecases/README.md — applying the edit (`applyPlannedMesocycleEdit`,
// `renamedMesocycle`) stays in `domain/`.

import { NotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import {
  applyPlannedMesocycleEdit,
  renamedMesocycle,
  type ScratchMesocycleDraftInput,
} from '@domain/mesocycleBuilders';
import type { MesocycleRepository } from '@repositories/mesocycle';

export type MesocycleEditingDeps = {
  mesocycleRepo: MesocycleRepository;
};

async function existingMesocycle(id: string, deps: MesocycleEditingDeps): Promise<Mesocycle> {
  const existing = await deps.mesocycleRepo.getById(id);
  if (!existing) {
    throw new NotFoundError(`Mesocycle "${id}" does not exist.`);
  }
  return existing;
}

/**
 * Saves an edited draft (from the same editor used at creation) over the planned mesocycle `id`
 * via `MesocycleRepository.update`. Rejects with `NotFoundError` if `id` doesn't exist, or
 * `ConflictError` if the mesocycle is active, completed, or abandoned — nothing is written then.
 */
export async function editPlannedMesocycle(
  id: string,
  input: ScratchMesocycleDraftInput,
  deps: MesocycleEditingDeps,
): Promise<Mesocycle> {
  return deps.mesocycleRepo.update(
    applyPlannedMesocycleEdit(await existingMesocycle(id, deps), input),
  );
}

/**
 * Renames mesocycle `id` to `name`, trimmed. Works on a block in any status — the action lives in
 * the workout header menu, which is open over an active block and over a read-only day of a
 * finished one alike.
 *
 * Rejects with `NotFoundError` if `id` doesn't exist, and with a plain `Error` if `name` is empty
 * once trimmed (`normalizeMesocycleName`); nothing is written in either case, so the block keeps
 * the name it had.
 */
export async function renameMesocycle(
  id: string,
  name: string,
  deps: MesocycleEditingDeps,
): Promise<Mesocycle> {
  return deps.mesocycleRepo.update(renamedMesocycle(await existingMesocycle(id, deps), name));
}
