// Folds an exercise's performances into the Overview tab's model — see 08.6 · Библиотека
// упражнений, "Определение плиток" and "Последняя сессия", and its mockup 02-exercise-detail.html.
// Pure: everything comes from the arguments, nothing is read or formatted here (the screen turns
// `lastDoneAt` into `3 d`).

import type { Exercise } from './catalog';
import type { SetLog } from './execution';
import type {
  ExerciseBestSet,
  ExerciseLastSession,
  ExerciseOverview,
  ExerciseOverviewAction,
  ExerciseOverviewStats,
  ExercisePerformance,
  ExerciseSessionSummary,
} from './exerciseOverview';

/**
 * How many sessions the `Earlier` block lists under the last one. Overview is the quick recall
 * before a set, not the history screen (06 · History & Analytics) — three lines are enough to see
 * where the weight is going, and `See full history` sits right under them for the rest.
 */
export const EARLIER_SESSION_LIMIT = 3;

/**
 * The Overview model for `exercise` over every performance of it, in any order.
 *
 * With no set logged at all there are no tiles and no sessions — the screen shows the empty state
 * instead (08.6, "Пустое состояние").
 */
export function buildExerciseOverview(
  exercise: Exercise,
  performances: readonly ExercisePerformance[],
): ExerciseOverview {
  const performed = performances.filter((performance) => performance.setLogs.length > 0);
  const [last, ...earlier] = completedNewestFirst(performed);

  return {
    exercise,
    stats: buildExerciseOverviewStats(performed),
    lastSession: last ? toLastSession(last) : null,
    earlierSessions: earlier.slice(0, EARLIER_SESSION_LIMIT).map(toSessionSummary),
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
    bestSet,
    sessionCount: new Set(performances.map((performance) => performance.session.id)).size,
    lastDoneAt: setLogs.reduce(
      (latest, log) => (log.completedAt > latest ? log.completedAt : latest),
      setLogs[0]?.completedAt ?? '',
    ),
  };
}

/**
 * The completed sessions holding a set of the exercise, most recent first (08.6: "Берётся
 * последняя завершённая сессия"). A session still in progress — the one being trained right now —
 * is not among them: these blocks exist to recall what was already done.
 */
function completedNewestFirst(performances: readonly ExercisePerformance[]): ExercisePerformance[] {
  return performances
    .filter(
      (performance) =>
        performance.session.status === 'completed' && performance.session.completedAt !== undefined,
    )
    .sort((a, b) => completionOf(b).localeCompare(completionOf(a)));
}

function toLastSession(performance: ExercisePerformance): ExerciseLastSession {
  return {
    weekNumber: performance.session.weekNumber,
    dayNumber: performance.session.dayNumber,
    completedAt: completionOf(performance),
    setLogs: [...performance.setLogs].sort((a, b) => a.setNumber - b.setNumber),
  };
}

function toSessionSummary(performance: ExercisePerformance): ExerciseSessionSummary {
  return {
    weekNumber: performance.session.weekNumber,
    dayNumber: performance.session.dayNumber,
    completedAt: completionOf(performance),
    // Never null here: only performances carrying at least one set get this far.
    bestSet: findBestSet(performance.setLogs) ?? { weight: 0, reps: 0 },
    setCount: performance.setLogs.length,
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

function completionOf(performance: ExercisePerformance): string {
  return performance.session.completedAt ?? '';
}
