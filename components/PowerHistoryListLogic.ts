// Pure, non-JSX logic behind PowerHistoryList.tsx — see the code-style skill.

import type { PowerLoad } from '@domain/exerciseConfig';
import type {
  ExerciseHistoryMesocycle,
  PowerHistoryWeek,
  PowerLoadChange,
} from '@domain/exerciseHistory';
import { buildPowerWeeklyHistory } from '@domain/exerciseHistoryBuilders';

import { formatRowWeight } from './WorkoutSetRowLogic';

/**
 * One SectionList section: a mesocycle, and its weeks as a single item — they are drawn as one
 * card, a row per week, and a card can't be split across items.
 */
export type PowerHistorySection = {
  mesoId: string;
  title: string;
  weekCount: number;
  data: [PowerHistoryWeek[]];
};

export function buildPowerHistorySections(
  groups: readonly ExerciseHistoryMesocycle[],
  load: PowerLoad,
): PowerHistorySection[] {
  return buildPowerWeeklyHistory(groups, load).map((section) => ({
    mesoId: section.mesoId,
    title: section.name,
    weekCount: section.weeks.length,
    data: [section.weeks],
  }));
}

/** A week's row label — `Week 3`. */
export function formatPowerWeekLabel(week: PowerHistoryWeek): string {
  return `Week ${week.weekNumber}`;
}

/**
 * The week's best set, read the way its Load column is (`powerLoadColumnLabel`): `6 kg × 5`,
 * `Level 2 × 3`; with no load of its own the weight is the body weight, so `80 kg × 5` too.
 */
export function formatPowerBestSet(week: PowerHistoryWeek, load: PowerLoad): string {
  const { weight, reps } = week.bestSet;
  return load === 'level'
    ? `Level ${formatRowWeight(weight)} × ${reps}`
    : `${formatRowWeight(weight)} kg × ${reps}`;
}

const LOAD_CHANGE_TEXT: Record<'weight' | 'level', Record<PowerLoadChange, string>> = {
  weight: { up: 'Heavier', down: 'Lighter' },
  level: { up: 'Higher level', down: 'Lower level' },
};

/**
 * What happened that week, after the set and a step quieter: ` · Heavier`, ` · Top of range`, or
 * both. `undefined` for a week that only went on as planned.
 */
export function formatPowerWeekTail(week: PowerHistoryWeek, load: PowerLoad): string | undefined {
  const notes: string[] = [];
  if (week.loadChange !== undefined && load !== 'none') {
    notes.push(LOAD_CHANGE_TEXT[load][week.loadChange]);
  }
  if (week.isAtTopOfRange) {
    notes.push('Top of range');
  }
  return notes.length === 0 ? undefined : ` · ${notes.join(' · ')}`;
}
