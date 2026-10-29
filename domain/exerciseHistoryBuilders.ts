// Groups an exercise's performances into the History tab's list — see 06 · History & Analytics,
// Сценарий 2. Pure: everything comes from the argument, nothing is read or formatted here.

import type {
  ExerciseHistoryMesocycle,
  ExerciseHistoryPerformance,
  ExerciseHistorySession,
} from './exerciseHistory';

/**
 * Every completed session holding a set or a round of the exercise, newest first, grouped by mesocycle —
 * sections ordered by their own newest session, so the list as a whole still reads newest to
 * oldest across the mesocycle boundary (06: "Сквозная через все мезоциклы. Граница мезоцикла не
 * обрывает историю").
 *
 * A session still in progress is left out, the same way the Overview tab's blocks leave it out:
 * this is the record of what was already done.
 */
export function buildExerciseHistory(
  performances: readonly ExerciseHistoryPerformance[],
): ExerciseHistoryMesocycle[] {
  const completed = performances
    .filter(
      (performance) =>
        hasLogs(performance) &&
        performance.session.status === 'completed' &&
        performance.session.completedAt !== undefined,
    )
    .sort((a, b) => completionOf(b).localeCompare(completionOf(a)));

  // A Map keeps insertion order, so a mesocycle takes the place of its newest session — no second
  // sort over the groups.
  const groups = new Map<string, ExerciseHistoryMesocycle>();
  for (const performance of completed) {
    const existing = groups.get(performance.mesocycle.id);
    const session = toHistorySession(performance);
    if (existing) {
      existing.sessions.push(session);
    } else {
      groups.set(performance.mesocycle.id, {
        mesoId: performance.mesocycle.id,
        name: performance.mesocycle.name,
        sessions: [session],
      });
    }
  }
  return [...groups.values()];
}

function toHistorySession(performance: ExerciseHistoryPerformance): ExerciseHistorySession {
  const setLogs = [...performance.setLogs].sort((a, b) => a.setNumber - b.setNumber);
  const roundLogs = [...performance.roundLogs].sort((a, b) => a.roundNumber - b.roundNumber);
  return {
    // Non-null: only performances carrying at least one set or round get this far.
    id: setLogs[0]?.id ?? roundLogs[0]?.id ?? performance.session.id,
    weekNumber: performance.session.weekNumber,
    dayNumber: performance.session.dayNumber,
    completedAt: completionOf(performance),
    setLogs,
    roundLogs,
  };
}

/**
 * A performance with something logged — sets or rounds, whichever its exercise has. Shared with
 * the Overview tab, which counts and dates the same performances.
 */
export function hasLogs(performance: Pick<ExerciseHistoryPerformance, 'setLogs' | 'roundLogs'>) {
  return performance.setLogs.length > 0 || performance.roundLogs.length > 0;
}

function completionOf(performance: ExerciseHistoryPerformance): string {
  return performance.session.completedAt ?? '';
}
