// Folds an exercise's performances into the Overview tab's model — see 08.6 · Библиотека
// упражнений, "Определение плиток". Sessions one by one are the History tab's
// (exerciseHistoryBuilders.ts), not this model's (GT-195).
// Pure: everything comes from the arguments, nothing is read or formatted here (the screen turns
// `lastDoneAt` into `3 d`).

import type { Exercise } from './catalog';
import type { SetLog } from './execution';
import type { ExerciseHistoryPerformance } from './exerciseHistory';
import { isDonePerformance } from './exerciseHistoryBuilders';
import type {
  ExerciseBestSet,
  ExerciseOverview,
  ExerciseOverviewAction,
  ExerciseOverviewStats,
} from './exerciseOverview';

/**
 * The Overview model for `exercise` over every performance of it, in any order.
 *
 * The tiles count what the History tab lists — sessions that are over, with something logged
 * (`isDonePerformance`, GT-260) — so Sessions and the list never disagree. With nothing like that,
 * there are no tiles — the screen shows the empty state instead (08.6, "Пустое состояние").
 */
export function buildExerciseOverview(
  exercise: Exercise,
  performances: readonly ExerciseHistoryPerformance[],
): ExerciseOverview {
  return {
    exercise,
    stats: buildExerciseOverviewStats(performances.filter(isDonePerformance)),
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
  performances: readonly ExerciseHistoryPerformance[],
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
    bestSet: findBestSet(setLogsInLatestUnit(performances)),
    sessionCount: new Set(performances.map((performance) => performance.session.id)).size,
    lastDoneAt: completions.reduce((latest, at) => (at > latest ? at : latest), first),
  };
}

/**
 * The sets logged in the unit of the most recent block that logged any (GT-269). A weight is a
 * number in its block's unit: 120 lb is not heavier than 60 kg, and a converted one is a guess — so
 * the best set is looked for in the unit the user lifts in now, as logged.
 */
function setLogsInLatestUnit(performances: readonly ExerciseHistoryPerformance[]): SetLog[] {
  const withSets = performances.filter((performance) => performance.setLogs.length > 0);
  const latest = withSets.reduce<ExerciseHistoryPerformance | undefined>(
    (current, performance) =>
      current === undefined || lastSetAt(performance) > lastSetAt(current) ? performance : current,
    undefined,
  );
  if (latest === undefined) {
    return [];
  }
  const unit = latest.mesocycle.weightUnit;
  return withSets
    .filter((performance) => performance.mesocycle.weightUnit === unit)
    .flatMap((performance) => performance.setLogs);
}

function lastSetAt(performance: ExerciseHistoryPerformance): string {
  return performance.setLogs.reduce(
    (latest, log) => (log.completedAt > latest ? log.completedAt : latest),
    '',
  );
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
