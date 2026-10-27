// Aggregating a mesocycle's summary — see 08.9 · Мезоцикл (деталь), "Сводка", and 06 · History &
// Analytics, "Определения метрик". Aggregates are counted here, over raw data, and never in storage
// (06: otherwise moving to a backend means rewriting the logic on the server). Pure: the use case
// layer reads the sessions, their set logs and the exercises behind them.

import { MUSCLE_GROUPS, type Exercise, type MuscleGroup } from './catalog';
import { exerciseTypeOf } from './exerciseConfigBuilders';
import type { Mesocycle } from './mesocycle';
import { currentWeekNumber } from './mesoGridBuilders';
import type {
  MesoHybridTable,
  MesoHybridType,
  MesoSessionLog,
  MesoSummary,
  MesoWeeklyExerciseRow,
  MesoWeeklySetsRow,
} from './mesoSummary';

type SummaryExercise = Pick<Exercise, 'id' | 'name' | 'muscleGroup' | 'type'>;

/** The order of the type tables under the Strength card. */
const HYBRID_TYPE_ORDER: readonly MesoHybridType[] = ['power', 'interval', 'mobility'];

/**
 * The summary of `mesocycle` from its sessions and their logs (any order; sessions of other
 * mesocycles or outside the block's weeks are ignored). `exercises` resolves each log's type and
 * group — the log's own `exerciseId`, so a swapped exercise counts toward what was actually
 * trained. `Sets` and the Strength card count `strength` exercises only; every other type gets a
 * table of its own (GT-113).
 */
export function buildMesoSummary(
  mesocycle: Mesocycle,
  sessionLogs: readonly MesoSessionLog[],
  exercises: readonly SummaryExercise[],
): MesoSummary {
  const exerciseById = new Map<string, SummaryExercise>(
    exercises.map((exercise) => [exercise.id, exercise]),
  );
  const isStrength = (exerciseId: string) => {
    const exercise = exerciseById.get(exerciseId);
    return exercise !== undefined && exerciseTypeOf(exercise) === 'strength';
  };
  const own = sessionLogs.filter(
    ({ session }) =>
      session.mesoId === mesocycle.id &&
      session.weekNumber >= 1 &&
      session.weekNumber <= mesocycle.lengthWeeks,
  );
  const strength = own.map(({ session, setLogs }) => ({
    session,
    setLogs: setLogs.filter((setLog) => isStrength(setLog.exerciseId)),
  }));

  const completed = own.filter(({ session }) => session.status === 'completed').length;
  // The week the block is on, by workouts — the same number its subtitle shows (08.3's rule). Not
  // the weeks that merely hold a session: generation runs a day ahead (03, "Ленивая генерация по
  // дням"), so finishing W1 Day 1 already creates W2 Day 1, and a count of those read `2 / 4` under
  // `Week 1 of 4` (Artem's check on 130, 26.09.2026). A block with no session yet is on no week.
  const weeksReached = own.length === 0 ? 0 : currentWeekNumber(own.map(({ session }) => session));

  return {
    workouts:
      mesocycle.status === 'abandoned'
        ? { value: completed }
        : { value: completed, total: mesocycle.lengthWeeks * mesocycle.daysPerWeek },
    strengthSets: strength.reduce((sum, { setLogs }) => sum + setLogs.length, 0),
    weeks: { value: weeksReached, total: mesocycle.lengthWeeks },
    weeklySets: weeklySets(mesocycle.lengthWeeks, strength, exercises),
    hybridTables: hybridTables(mesocycle.lengthWeeks, own, exerciseById),
  };
}

/**
 * Sets per muscle group per week (06, "Недельный объём группы мышц"): every set of every exercise
 * of that group. Groups without a single set in the block are left out.
 */
function weeklySets(
  lengthWeeks: number,
  sessionLogs: readonly Pick<MesoSessionLog, 'session' | 'setLogs'>[],
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

/**
 * A table per hybrid type, a row per exercise of it (GT-113): what the type logs, by week — a
 * power exercise's sets, an interval's rounds, a mobility block's times done. An exercise logs
 * sets or rounds, never both, so the two are simply added up.
 */
function hybridTables(
  lengthWeeks: number,
  sessionLogs: readonly MesoSessionLog[],
  exerciseById: ReadonlyMap<string, SummaryExercise>,
): MesoHybridTable[] {
  const rowById = new Map<string, MesoWeeklyExerciseRow>();
  const count = (exerciseId: string, weekNumber: number) => {
    const exercise = exerciseById.get(exerciseId);
    if (exercise === undefined || exerciseTypeOf(exercise) === 'strength') {
      return;
    }
    const row = rowById.get(exerciseId) ?? {
      exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      counts: Array.from({ length: lengthWeeks }, () => 0),
    };
    row.counts[weekNumber - 1] = (row.counts[weekNumber - 1] ?? 0) + 1;
    rowById.set(exerciseId, row);
  };
  for (const { session, setLogs, roundLogs } of sessionLogs) {
    for (const log of [...setLogs, ...roundLogs]) {
      count(log.exerciseId, session.weekNumber);
    }
  }

  return HYBRID_TYPE_ORDER.flatMap((type) => {
    const rows = [...rowById.values()]
      .filter((row) => {
        const exercise = exerciseById.get(row.exerciseId);
        return exercise !== undefined && exerciseTypeOf(exercise) === type;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
    return rows.length === 0 ? [] : [{ type, rows }];
  });
}
