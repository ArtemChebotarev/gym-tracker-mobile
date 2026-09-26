// Aggregating a mesocycle's summary — see 08.9 · Мезоцикл (деталь), "Сводка", and 06 · History &
// Analytics, "Определения метрик". Aggregates are counted here, over raw data, and never in storage
// (06: otherwise moving to a backend means rewriting the logic on the server). Pure: the use case
// layer reads the sessions, their set logs and the exercises behind them.

import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from './catalog';
import type { Mesocycle } from './mesocycle';
import { currentWeekNumber } from './mesoGridBuilders';
import type { MesoSessionLog, MesoSummary, MesoWeeklySetsRow } from './mesoSummary';

/**
 * The summary of `mesocycle` from its sessions and their set logs (any order; sessions of other
 * mesocycles or outside the block's weeks are ignored). `exercises` resolves each set's muscle
 * group — the set's own `exerciseId`, so a swapped exercise counts toward the group actually
 * trained.
 */
export function buildMesoSummary(
  mesocycle: Mesocycle,
  sessionLogs: readonly MesoSessionLog[],
  exercises: readonly Pick<Exercise, 'id' | 'muscleGroup'>[],
): MesoSummary {
  const own = sessionLogs.filter(
    ({ session }) =>
      session.mesoId === mesocycle.id &&
      session.weekNumber >= 1 &&
      session.weekNumber <= mesocycle.lengthWeeks,
  );

  const completed = own.filter(({ session }) => session.status === 'completed').length;
  // The week the block is on, by workouts — the same number its subtitle shows (08.3's rule). Not
  // the weeks that merely hold a session: generation runs a day ahead (03, "Ленивая генерация по
  // дням"), so finishing W1 Day 1 already creates W2 Day 1, and a count of those read `2 / 4` under
  // `Week 1 of 4` (Artem's check on 130, 26.09.2026). A block with no session yet is on no week.
  const weeksReached =
    own.length === 0 ? 0 : currentWeekNumber(own.map(({ session }) => session));

  return {
    workouts:
      mesocycle.status === 'abandoned'
        ? { value: completed }
        : { value: completed, total: mesocycle.lengthWeeks * mesocycle.daysPerWeek },
    strengthSets: own.reduce((sum, { setLogs }) => sum + setLogs.length, 0),
    weeks: { value: weeksReached, total: mesocycle.lengthWeeks },
    weeklySets: weeklySets(mesocycle.lengthWeeks, own, exercises),
  };
}

/**
 * Sets per muscle group per week (06, "Недельный объём группы мышц"): every set of every exercise
 * of that group. Groups without a single set in the block are left out.
 */
function weeklySets(
  lengthWeeks: number,
  sessionLogs: readonly MesoSessionLog[],
  exercises: readonly Pick<Exercise, 'id' | 'muscleGroup'>[],
): MesoWeeklySetsRow[] {
  const groupOf = new Map<string, MuscleGroup>(
    exercises.map((exercise) => [exercise.id, exercise.muscleGroup]),
  );
  const byGroup = new Map<MuscleGroup, number[]>();

  for (const { session, setLogs } of sessionLogs) {
    for (const setLog of setLogs) {
      const group = groupOf.get(setLog.exerciseId);
      if (group === undefined) {
        continue;
      }
      const sets = byGroup.get(group) ?? Array.from({ length: lengthWeeks }, () => 0);
      sets[session.weekNumber - 1] = (sets[session.weekNumber - 1] ?? 0) + 1;
      byGroup.set(group, sets);
    }
  }

  return MUSCLE_GROUPS.flatMap((muscleGroup) => {
    const sets = byGroup.get(muscleGroup);
    return sets ? [{ muscleGroup, sets }] : [];
  });
}
