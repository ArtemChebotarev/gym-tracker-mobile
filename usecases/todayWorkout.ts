// What the Today tab opens — task 099 (08 · Screens & Navigation, "Сегодня"; 08.7 · Тренировка,
// "Навигация"). Today is the way into the workout screen: the session in progress, otherwise the
// next day of the active mesocycle (`todaySession`), in whatever mode it's in — an `awaiting_source`
// one opens as a preview naming the workout that unlocks it. Without an active mesocycle, or once it
// has nothing left, there's no session to show and the tab says why instead — and, when a cycle
// is planned but not started, sends the user to the Cycles tab to start it (GT-38, 08.11).

import { todaySession } from '@domain/mesoGridBuilders';
import type { MesocycleRepository } from '@repositories/mesocycle';

import {
  getWorkoutSession,
  type WorkoutSessionDeps,
  type WorkoutSessionModel,
} from './workoutSession';

export type TodayWorkoutDeps = WorkoutSessionDeps & {
  mesocycleRepo: MesocycleRepository;
};

export type TodayWorkout =
  /** The session to open, in the mode its status calls for. */
  | { kind: 'session'; model: WorkoutSessionModel }
  /** No mesocycle is active and none is planned — the tab invites creating one. */
  | { kind: 'noActiveMesocycle' }
  /**
   * No mesocycle is active, but at least one is planned — creating another would be the wrong
   * invitation. Which of several to start is chosen in the Cycles list, so this names none.
   */
  | { kind: 'cyclePlanned' }
  /** The active mesocycle has no session left to train. */
  | { kind: 'allDone'; mesoId: string };

/**
 * The Today tab's workout: the session `in_progress` — only one can be, app-wide (02, "Session") —
 * otherwise `todaySession` of the active mesocycle.
 *
 * Rejects as `getWorkoutSession` does for the session it picks.
 */
export async function getTodayWorkout(deps: TodayWorkoutDeps): Promise<TodayWorkout> {
  const inProgress = await deps.sessionRepo.getCurrentInProgress();
  if (inProgress) {
    return { kind: 'session', model: await getWorkoutSession(inProgress.id, deps) };
  }
  const mesocycle = await deps.mesocycleRepo.getActive();
  if (!mesocycle) {
    const hasPlanned = (await deps.mesocycleRepo.getAll()).some(
      (candidate) => candidate.status === 'planned',
    );
    return { kind: hasPlanned ? 'cyclePlanned' : 'noActiveMesocycle' };
  }
  const next = todaySession(await deps.sessionRepo.listByMesoId(mesocycle.id));
  if (!next) {
    return { kind: 'allDone', mesoId: mesocycle.id };
  }
  return { kind: 'session', model: await getWorkoutSession(next.id, deps) };
}
