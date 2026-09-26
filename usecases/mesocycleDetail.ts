// "Мезоцикл (деталь)" — 08.9, task 129. Orchestration only: reads the mesocycle, its sessions,
// their set logs and the exercises behind those sets, and hands them to the domain — the summary is
// `buildMesoSummary` (055) and the week is `currentWeekNumber` (089), per 06 · History & Analytics
// ("Агрегаты считаются в доменном слое поверх сырых данных"). The workout grid of a closed block
// (130) is `buildMesoGrid` (089) over the same sessions.

import { toExerciseId } from '@domain/catalog';
import type { Mesocycle } from '@domain/mesocycle';
import type { MesoGrid } from '@domain/mesoGrid';
import type { MesoSummary } from '@domain/mesoSummary';
import { buildMesoSummary } from '@domain/mesoSummaryBuilders';
import { buildMesoGrid, currentWeekNumber } from '@domain/mesoGridBuilders';
import type { ExerciseRepository } from '@repositories/catalog';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { SessionRepository } from '@repositories/session';
import type { SetLogRepository } from '@repositories/setLogRepository';

export type MesocycleDetailDeps = {
  mesocycleRepo: MesocycleRepository;
  sessionRepo: SessionRepository;
  setLogRepo: SetLogRepository;
  exerciseRepo: ExerciseRepository;
};

export type MesocycleDetail = {
  mesocycle: Mesocycle;
  summary: MesoSummary;
  /**
   * The week the block is on, counted by workouts and not by the calendar (08.3's rule): the
   * `Week 4 of 7` of an active block. Once every session is final — a stopped block — it's the
   * latest week that has one, the `Stopped in week 4`.
   */
  weekNumber: number;
  /** The week × day grid — the screen draws it for a closed block only (08.9, task 130). */
  grid: MesoGrid;
};

/**
 * The detail of mesocycle `mesoId`, or `null` when no such mesocycle exists — the screen then shows
 * its "not found" state (08.9, "Пустые и граничные состояния").
 */
export async function loadMesocycleDetail(
  mesoId: string,
  deps: MesocycleDetailDeps,
): Promise<MesocycleDetail | null> {
  const mesocycle = await deps.mesocycleRepo.getById(mesoId);
  if (!mesocycle) {
    return null;
  }
  const sessions = await deps.sessionRepo.listByMesoId(mesoId);
  const sessionLogs = await Promise.all(
    sessions.map(async (session) => ({
      session,
      setLogs: await deps.setLogRepo.listBySessionId(session.id),
    })),
  );
  const exerciseIds = new Set(
    sessionLogs.flatMap(({ setLogs }) => setLogs.map((setLog) => setLog.exerciseId)),
  );
  const exercises = await deps.exerciseRepo.listByIds([...exerciseIds].map(toExerciseId));

  return {
    mesocycle,
    summary: buildMesoSummary(mesocycle, sessionLogs, exercises),
    weekNumber: currentWeekNumber(sessions),
    grid: buildMesoGrid(mesocycle, sessions),
  };
}
