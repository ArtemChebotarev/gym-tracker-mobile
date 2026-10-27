// Pure, non-JSX logic behind ExerciseDetailScreen.tsx — see the code-style skill.

import type { Equipment, Exercise } from '@domain/catalog';
import type { PowerLoad } from '@domain/exerciseConfig';
import { defaultExerciseConfig, exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import type { SetLog } from '@domain/execution';
import type { ExerciseBestSet, ExerciseLastSession } from '@domain/exerciseOverview';
import { parseUtcIso } from '@domain/time';
import { formatAbsoluteDate } from '@design/formatDate';
import { formatRir } from '@design/formatRir';
import { formatShortDuration } from '@design/formatShortDuration';

import { formatLoggedWeight, formatRowWeight } from './WorkoutSetRowLogic';

/** The two tabs of the Exercise screen (08.6, "Переключатель"). */
export type ExerciseDetailTab = 'overview' | 'history';

export const EXERCISE_DETAIL_TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'history', label: 'History' },
] as const;

/** `Best set` — `85×8`, no unit (08.6, "Определение плиток"). */
export function formatBestSet(bestSet: ExerciseBestSet): string {
  return `${bestSet.weight}×${bestSet.reps}`;
}

/** `Last done` — `3 d`, `2 w` (08.6). */
export function formatLastDone(lastDoneAt: string, now: Date = new Date()): string {
  return formatShortDuration(parseUtcIso(lastDoneAt), now);
}

/** The Last session label's right-hand side: `Week 3 · Day 1 · 10 Aug` (the mockup). */
export function formatLastSessionMeta(lastSession: ExerciseLastSession): string {
  const date = formatAbsoluteDate(parseUtcIso(lastSession.completedAt));
  return `Week ${lastSession.weekNumber} · Day ${lastSession.dayNumber} · ${date}`;
}

/** A logged set's row label — `Set 1`. */
export function formatSetLabel(setLog: Pick<SetLog, 'setNumber'>): string {
  return `Set ${setLog.setNumber}`;
}

/**
 * A logged set's value: `80 kg × 9`. The `· 2 RIR` tail is rendered separately and a step quieter
 * (the mockup), so it isn't part of this string — see `formatSetRirTail`.
 *
 * The weight goes through the workout row's own formatter rather than `design/formatSet`, so a
 * `bodyweight-weighted` set reads back the way it was logged — `83 (+5) kg × 9`, the body weight
 * and what was hung on it kept apart (task 105).
 *
 * A power set is the same row in its own load (10.1 FR-12, GT-110): a level reads `Level 2 × 3`,
 * as its card's Load column says, not as kilograms.
 */
export function formatSetValue(
  setLog: SetLog,
  equipment?: Equipment,
  powerLoad?: PowerLoad,
): string {
  if (powerLoad === 'level') {
    return `Level ${formatRowWeight(setLog.weight)} × ${setLog.reps}`;
  }
  return `${formatLoggedWeight(setLog, equipment)} kg × ${setLog.reps}`;
}

/**
 * The ` · 2 RIR` tail, or `undefined` when the set has no `rir` — 08.6: "если его нет, часть после
 * точки не выводится", so there is no tail at all rather than an empty one. A power set never has
 * one: power has no RIR (10.1 FR-3), whatever a record may carry.
 */
export function formatSetRirTail(setLog: SetLog, powerLoad?: PowerLoad): string | undefined {
  return setLog.rir === undefined || powerLoad !== undefined
    ? undefined
    : ` · ${formatRir(setLog.rir)}`;
}

/**
 * The load a power exercise's logged sets read in (10.1 FR-12), `undefined` for every other type.
 * An exercise stored without a config reads as the type's default, as everywhere else.
 */
export function powerLoadOf(exercise: Pick<Exercise, 'type' | 'config'>): PowerLoad | undefined {
  if (exerciseTypeOf(exercise) !== 'power') {
    return undefined;
  }
  const config = exercise.config ?? defaultExerciseConfig('power');
  return config?.type === 'power' ? config.load : undefined;
}
