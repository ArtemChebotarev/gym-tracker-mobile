// Mesocycle overview grid — task 089 (08.7 · Тренировка, "Лист «Обзор мезоцикла»"). Orchestration
// only: reads the mesocycle and its sessions, and `buildMesoGrid` lays them out.

import { NotFoundError } from '@domain/errors';
import type { MesoGrid } from '@domain/mesoGrid';
import { buildMesoGrid } from '@domain/mesoGridBuilders';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { SessionRepository } from '@repositories/session';

export type MesoGridDeps = {
  mesocycleRepo: MesocycleRepository;
  sessionRepo: SessionRepository;
};

/**
 * The week × day grid of mesocycle `mesoId`: every cell's state and session id (if it exists),
 * which week is the deload, and the current week. Rejects with `NotFoundError` if the mesocycle
 * doesn't exist.
 */
export async function getMesoGrid(mesoId: string, deps: MesoGridDeps): Promise<MesoGrid> {
  const mesocycle = await deps.mesocycleRepo.getById(mesoId);
  if (!mesocycle) {
    throw new NotFoundError(`Mesocycle "${mesoId}" does not exist.`);
  }
  return buildMesoGrid(mesocycle, await deps.sessionRepo.listByMesoId(mesoId));
}
