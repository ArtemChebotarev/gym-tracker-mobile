// Folds an exercise's performances into the Overview tab's model — see 08.6 · Библиотека
// упражнений, "Определение плиток" and "Последняя сессия". Pure: everything comes from the
// arguments, nothing is read or formatted here (the screen turns `lastDoneAt` into `3 d`).

import type { Exercise } from './catalog';
import type { SetLog } from './execution';
import type {
  ExerciseBestSet,
  ExerciseLastSession,
  ExerciseOverview,
  ExerciseOverviewAction,
  ExerciseOverviewStats,
  ExercisePerformance,
} from './exerciseOverview';

/**
 * The Overview model for `exercise` over every performance of it, in any order.
 *
 * With no set logged at all there are no tiles and no last session — the screen shows the empty
 * state instead (08.6, "Пустое состояние").
 */
export function buildExerciseOverview(
  exercise: Exercise,
  performances: readonly ExercisePerformance[],
): ExerciseOverview {
  const performed = performances.filter((performance) => performance.setLogs.length > 0);

  return {
    exercise,
    stats: buildExerciseOverviewStats(performed),
    lastSession: buildExerciseLastSession(performed),
    actions: exerciseOverviewActions(exercise),
  };
}

/**
 * A catalog exercise can only ever be hidden; a custom one can also be edited (08.6, "Меню и
 * действия"). There is no delete action at all — an exercise with references is never deleted
 * (02 · Domain Model).
 */
export function exerciseOverviewActions(exercise: Exercise): ExerciseOverviewAction[] {
  return exercise.source === 'custom' ? ['edit', 'hide'] : ['hide'];
}

function buildExerciseOverviewStats(
  performances: readonly ExercisePerformance[],
): ExerciseOverviewStats | null {
  const setLogs = performances.flatMap((performance) => performance.setLogs);
  const bestSet = findBestSet(setLogs);
  if (!bestSet) {
    return null;
  }

  return {
    bestSet: { weight: bestSet.weight, reps: bestSet.reps },
    sessionCount: new Set(performances.map((performance) => performance.session.id)).size,
    lastDoneAt: setLogs.reduce(
      (latest, log) => (log.completedAt > latest ? log.completedAt : latest),
      setLogs[0]?.completedAt ?? '',
    ),
    setCount: setLogs.length,
    mesocycleCount: new Set(performances.map((performance) => performance.session.mesoId)).size,
  };
}

/**
 * The heaviest set: maximum `weight`, ties broken by `reps` (08.6). On a `bodyweight-weighted`
 * exercise `weight` is the added weight (task 105) — which is the axis that progresses, so it is
 * also the one the tile compares on.
 */
function findBestSet(setLogs: readonly SetLog[]): ExerciseBestSet | null {
  return setLogs.reduce<SetLog | null>((best, log) => {
    if (!best) {
      return log;
    }
    if (log.weight > best.weight) {
      return log;
    }
    return log.weight === best.weight && log.reps > best.reps ? log : best;
  }, null);
}

/**
 * The most recently completed session holding a set of the exercise (08.6: "Берётся последняя
 * завершённая сессия"). A session still in progress — the one being trained right now — is not it:
 * the block exists to recall what was already done.
 */
function buildExerciseLastSession(
  performances: readonly ExercisePerformance[],
): ExerciseLastSession | null {
  const completed = performances.filter(
    (performance) =>
      performance.session.status === 'completed' && performance.session.completedAt !== undefined,
  );
  const last = completed.reduce<ExercisePerformance | null>(
    (latest, performance) =>
      !latest || completionOf(performance) > completionOf(latest) ? performance : latest,
    null,
  );
  if (!last) {
    return null;
  }

  return {
    weekNumber: last.session.weekNumber,
    dayNumber: last.session.dayNumber,
    completedAt: completionOf(last),
    setLogs: [...last.setLogs].sort((a, b) => a.setNumber - b.setNumber),
  };
}

function completionOf(performance: ExercisePerformance): string {
  return performance.session.completedAt ?? '';
}
