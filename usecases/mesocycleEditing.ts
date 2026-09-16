// Mesocycle editing use cases — task 072 (04 · Meso Creation Flows, "Сохранение при
// подтверждении (Confirm)": a planned mesocycle stays fully editable until Start; 08.3 · Мезоциклы
// — список, `⋯` → Edit). Orchestration only, per usecases/README.md — applying the edit
// (`applyPlannedMesocycleEdit`) stays in `domain/`.

import { NotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import { applyPlannedMesocycleEdit, type ScratchMesocycleDraftInput } from '@domain/mesocycleBuilders';
import type { MesocycleRepository } from '@repositories/mesocycle';

export type MesocycleEditingDeps = {
  mesocycleRepo: MesocycleRepository;
};

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
  const existing = await deps.mesocycleRepo.getById(id);
  if (!existing) {
    throw new NotFoundError(`Mesocycle "${id}" does not exist.`);
  }
  return deps.mesocycleRepo.update(applyPlannedMesocycleEdit(existing, input));
}
