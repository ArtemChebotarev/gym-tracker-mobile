// Folds an exercise's performances into the Overview tab's model — see 08.6 · Библиотека
// упражнений, "Определение плиток". Sessions one by one are the History tab's
// (exerciseHistoryBuilders.ts), not this model's (GT-195).
// Pure: everything comes from the arguments, nothing is read or formatted here (the screen turns
// `lastDoneAt` into `3 d`).

import type { Exercise } from './catalog';
import type { SetLog } from './execution';
import { hasLogs } from './exerciseHistoryBuilders';
import type {
  ExerciseBestSet,
  ExerciseOverview,
  ExerciseOverviewAction,
  ExerciseOverviewStats,
  ExercisePerformance,
} from './exerciseOverview';

/**
 * The Overview model for `exercise` over every performance of it, in any order.
 *
 * With nothing logged at all, no set and no round, there are no tiles — the screen shows the empty
 * state instead (08.6, "Пустое состояние").
 */
export function buildExerciseOverview(
  exercise: Exercise,
  performances: readonly ExercisePerformance[],
): ExerciseOverview {
  return {
    exercise,
    stats: buildExerciseOverviewStats(performances.filter(hasLogs)),
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
  const completions = performances.flatMap((performance) => [
    ...performance.setLogs.map((log) => log.completedAt),
    ...performance.roundLogs.map((log) => log.completedAt),
  ]);
  const [first] = completions;
  if (first === undefined) {
    return null;
  }

  return {
    bestSet: findBestSet(performances.flatMap((performance) => performance.setLogs)),
    sessionCount: new Set(performances.map((performance) => performance.session.id)).size,
    lastDoneAt: completions.reduce((latest, at) => (at > latest ? at : latest), first),
  };
}

/**
 * The heaviest set: maximum `weight`, ties broken by `reps` (08.6). On a `bodyweight-weighted`
 * exercise `weight` is the added weight (task 105) — which is the axis that progresses, so it is
 * also the one this compares on.
 */
function findBestSet(setLogs: readonly SetLog[]): ExerciseBestSet | null {
  const best = setLogs.reduce<SetLog | null>((current, log) => {
    if (!current) {
      return log;
    }
    if (log.weight > current.weight) {
      return log;
    }
    return log.weight === current.weight && log.reps > current.reps ? log : current;
  }, null);
  return best ? { weight: best.weight, reps: best.reps } : null;
}
