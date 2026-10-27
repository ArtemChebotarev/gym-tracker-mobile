// Groups an exercise's performances into the History tab's list — see 06 · History & Analytics,
// Сценарий 2. Pure: everything comes from the argument, nothing is read or formatted here.

import type { SetLog } from './execution';
import type { PowerLoad } from './exerciseConfig';
import type {
  ExerciseHistoryMesocycle,
  ExerciseHistoryPerformance,
  ExerciseHistorySession,
  PowerHistoryMesocycle,
  PowerHistoryWeek,
} from './exerciseHistory';
import { POWER_MAX_REPS } from './progressionCorridor';

/**
 * Every completed session holding a set of the exercise, newest first, grouped by mesocycle —
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
        performance.setLogs.length > 0 &&
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
  return {
    // Non-null: only performances carrying at least one set get this far.
    id: setLogs[0]?.id ?? performance.session.id,
    weekNumber: performance.session.weekNumber,
    dayNumber: performance.session.dayNumber,
    completedAt: completionOf(performance),
    setLogs,
  };
}

function completionOf(performance: ExerciseHistoryPerformance): string {
  return performance.session.completedAt ?? '';
}

/**
 * A power exercise's history by week (10.1 FR-12, canvas 5.2): the same mesocycle sections as
 * `buildExerciseHistory`, each holding its weeks, newest first, with the best set of each and what
 * changed. A week's best set is taken over every session of it, so an exercise trained on two days
 * still gives one row.
 *
 * `load` says how the load reads: with `none` the logged weight is the body weight, which is not a
 * variation, so the best set goes by reps alone and no week shows a load change.
 */
export function buildPowerWeeklyHistory(
  groups: readonly ExerciseHistoryMesocycle[],
  load: PowerLoad,
): PowerHistoryMesocycle[] {
  const sections = groups.map((group) => ({
    mesoId: group.mesoId,
    name: group.name,
    weeks: weeksOf(group, load),
  }));
  markLoadChanges(sections, load);
  return sections;
}

function weeksOf(group: ExerciseHistoryMesocycle, load: PowerLoad): PowerHistoryWeek[] {
  const setsByWeek = new Map<number, SetLog[]>();
  for (const session of group.sessions) {
    const sets = setsByWeek.get(session.weekNumber) ?? [];
    sets.push(...session.setLogs);
    setsByWeek.set(session.weekNumber, sets);
  }
  const weeks: PowerHistoryWeek[] = [];
  for (const [weekNumber, sets] of setsByWeek) {
    const bestSet = load === 'none' ? findMostReps(sets) : findBestSet(sets);
    if (bestSet === null) {
      continue;
    }
    weeks.push({
      id: `${group.mesoId}:${weekNumber}`,
      weekNumber,
      bestSet,
      isAtTopOfRange: sets.every((set) => set.reps >= POWER_MAX_REPS),
    });
  }
  return weeks.sort((a, b) => b.weekNumber - a.weekNumber);
}

/** Walks every week oldest first — sections and weeks are both newest first — against the one before. */
function markLoadChanges(sections: readonly PowerHistoryMesocycle[], load: PowerLoad): void {
  if (load === 'none') {
    return;
  }
  const chronological = sections.flatMap((section) => section.weeks).reverse();
  for (let index = 1; index < chronological.length; index += 1) {
    const week = chronological[index];
    const previous = chronological[index - 1];
    if (week === undefined || previous === undefined) {
      continue;
    }
    if (week.bestSet.weight > previous.bestSet.weight) {
      week.loadChange = 'up';
    } else if (week.bestSet.weight < previous.bestSet.weight) {
      week.loadChange = 'down';
    }
  }
}

/**
 * The heaviest set: maximum `weight`, ties broken by `reps` (08.6). On a `bodyweight-weighted`
 * exercise `weight` is the added weight (task 105) — which is the axis that progresses, so it is
 * also the one this compares on. Shared with the Overview tab's `Best set` tile.
 */
export function findBestSet(setLogs: readonly SetLog[]): SetLog | null {
  return setLogs.reduce<SetLog | null>((current, log) => {
    if (!current) {
      return log;
    }
    if (log.weight > current.weight) {
      return log;
    }
    return log.weight === current.weight && log.reps > current.reps ? log : current;
  }, null);
}

/** The set with the most reps, the earliest of equals — for a load that doesn't vary. */
function findMostReps(setLogs: readonly SetLog[]): SetLog | null {
  return setLogs.reduce<SetLog | null>(
    (current, log) => (current === null || log.reps > current.reps ? log : current),
    null,
  );
}
