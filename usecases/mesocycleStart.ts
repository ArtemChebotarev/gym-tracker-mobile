// Start — task 042 (04 · Meso Creation Flows, "Запуск (Start)"; 08.3 · Мезоциклы — список,
// Planned → Start). Materializes a planned mesocycle's week 1 and puts it to work. Orchestration
// only, per usecases/README.md — what Start produces (`buildMesocycleStart`) stays in `domain/`.

import { NotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import { buildMesocycleStart } from '@domain/mesocycleBuilders';
import { nowAsUtcIso } from '@domain/time';
import type { MesocycleStartStore } from '@repositories/mesocycleStart';

export type MesocycleStartDeps = {
  store: MesocycleStartStore;
};

/**
 * Starts planned mesocycle `id`: in one transaction, creates week 1's sessions and their
 * exercises, then saves the mesocycle as `active` with `startDate = now`. The mesocycle is written
 * last — the order 04 asks of a medium that has to emulate transactions — so no failure can leave
 * it active without its sessions.
 *
 * Rejects with `NotFoundError` if `id` doesn't exist, and with `ConflictError` if it isn't
 * `planned`, has no week plan, or another mesocycle is active; nothing is written then.
 */
export async function startMesocycle(
  id: string,
  deps: MesocycleStartDeps,
  now: string = nowAsUtcIso(),
): Promise<Mesocycle> {
  return deps.store.transaction(async (repos) => {
    const mesocycle = await repos.mesocycleRepo.getById(id);
    if (!mesocycle) {
      throw new NotFoundError(`Mesocycle "${id}" does not exist.`);
    }
    const start = buildMesocycleStart(mesocycle, await repos.mesocycleRepo.getActive(), now);

    await repos.sessionRepo.createMany(start.week.map(({ session }) => session));
    await repos.sessionExerciseRepo.createMany(start.week.flatMap(({ exercises }) => exercises));
    return repos.mesocycleRepo.update(start.mesocycle);
  });
}
