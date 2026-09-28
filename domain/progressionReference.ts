// Progression engine — the reference resolver (03 · Progression Engine, "Резолвер референса";
// task 134.1). Rule 6 uses it today; Flow C moves onto it in 134.2. Pure: it takes the
// exercise's performances inside the history window, already read by the use case layer, and
// decides which one targets may be built on — and whether they are targets or only an estimate.
//
// The principle: **a +1 exists only in its own slot**, where the exercise was already done in the
// same place of the week. Numbers from another day or another block are a guide, not a base.

import type { SetLog } from '@domain/execution';
import type {
  ExercisePerformance,
  ReferenceResolution,
  ReferenceSlot,
  TrainingWeek,
} from '@domain/progression';

function isSameWeek(a: TrainingWeek, b: TrainingWeek): boolean {
  return a.mesoId === b.mesoId && a.weekNumber === b.weekNumber;
}

function latestFirst(a: ExercisePerformance, b: ExercisePerformance): number {
  return b.performedAt.localeCompare(a.performedAt);
}

function sameSets(a: readonly SetLog[], b: readonly SetLog[]): boolean {
  return (
    a.length === b.length &&
    a.every((set, index) => set.weight === b[index]?.weight && set.reps === b[index]?.reps)
  );
}

/**
 * Whether every performance says the same thing: the same number of logged sets, and the same
 * weight **and** reps in each position — the pair is compared whole, never one half of it.
 */
export function areIdentical(performances: readonly ExercisePerformance[]): boolean {
  const [first, ...rest] = performances;
  if (first === undefined) {
    return false;
  }
  const bySet = (logs: readonly SetLog[]) => [...logs].sort((x, y) => x.setNumber - y.setNumber);
  const reference = bySet(first.setLogs);
  return rest.every((performance) => sameSets(reference, bySet(performance.setLogs)));
}

/**
 * Groups performances by training week, the week of the newest performance first. Inside a week
 * the newest performance comes first too.
 */
function byWeekNewestFirst(performances: readonly ExercisePerformance[]): ExercisePerformance[][] {
  const weeks: ExercisePerformance[][] = [];
  for (const performance of [...performances].sort(latestFirst)) {
    const week = weeks.find(([first]) => first !== undefined && isSameWeek(first, performance));
    if (week) {
      week.push(performance);
    } else {
      weeks.push([performance]);
    }
  }
  return weeks;
}

/** One performance, or several that say the same thing: an estimate from the newest. */
function estimateIfUnambiguous(week: readonly ExercisePerformance[]): ReferenceResolution {
  const [newest] = week;
  return newest !== undefined && areIdentical(week)
    ? { kind: 'estimate', reference: newest, reason: 'other_slot' }
    : { kind: 'none' };
}

/**
 * The reference for an exercise placed into `slot`, from its `performances` inside the history
 * window (`historyLookbackDays` — the caller has already cut the window).
 *
 * Deload performances and ones with no set logged don't count. Of what is left, the reference
 * week is the latest training week that has any; for rule 6 (`slot.currentWeek` given) that is the
 * latest week **before** the current one, and the current week only when there is none. Then:
 *
 * - Reference week is the current one: one performance, or several identical → estimate; several
 *   that differ → none. There is no +1 inside a week.
 * - Same day in the slot's own mesocycle → target from that day's performance, whatever the rest
 *   of the week says. Day numbers aren't compared across mesocycles.
 * - Several identical, own mesocycle → target: the result didn't depend on the slot.
 * - One performance, or several identical in another mesocycle → estimate.
 * - Several that differ → none. Rule 6 doesn't fall back onto the current week then.
 */
export function resolveReference(
  performances: readonly ExercisePerformance[],
  slot: ReferenceSlot,
): ReferenceResolution {
  const counted = performances.filter(
    (performance) => !performance.isDeload && performance.setLogs.length > 0,
  );
  const weeks = byWeekNewestFirst(counted);
  const { currentWeek } = slot;
  const isCurrent = (week: readonly ExercisePerformance[]) =>
    currentWeek !== undefined && week[0] !== undefined && isSameWeek(week[0], currentWeek);

  const referenceWeek = weeks.find((week) => !isCurrent(week));
  if (referenceWeek === undefined) {
    const current = weeks.find(isCurrent);
    return current === undefined ? { kind: 'none' } : estimateIfUnambiguous(current);
  }

  const ownMeso = referenceWeek[0]?.mesoId === slot.mesoId;
  const sameDay = ownMeso
    ? referenceWeek.find((performance) => performance.dayNumber === slot.dayNumber)
    : undefined;
  if (sameDay !== undefined) {
    return { kind: 'target', reference: sameDay };
  }
  if (referenceWeek.length > 1 && ownMeso) {
    const [newest] = referenceWeek;
    return newest !== undefined && areIdentical(referenceWeek)
      ? { kind: 'target', reference: newest }
      : { kind: 'none' };
  }
  return estimateIfUnambiguous(referenceWeek);
}
