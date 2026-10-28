// Pure, non-JSX logic behind ExerciseDetailScreen.tsx — see the code-style skill.

import type { Equipment, Exercise } from '@domain/catalog';
import type { PowerLoad } from '@domain/exerciseConfig';
import { defaultExerciseConfig, exerciseTypeOf } from '@domain/exerciseConfigBuilders';
import type { RoundLog, SetLog } from '@domain/execution';
import type { ExerciseBestSet } from '@domain/exerciseOverview';
import { parseUtcIso } from '@domain/time';
import { formatClock } from '@design/formatClock';
import { formatRir } from '@design/formatRir';
import { formatShortDuration } from '@design/formatShortDuration';

import { POWER_LOAD_LABEL, powerNoHeavierLabel } from './ExerciseFormLogic';
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

/** One row of the Overview's Settings card: what is set, and to what. */
export type ExerciseSettingsRow = { key: string; label: string; value: string };

/**
 * The Settings card of the Overview (08.6, GT-196): how the exercise is set up in the library,
 * worded as the New exercise sheet words it, so a value is called one thing on every screen. Empty
 * for a type with nothing to set. An exercise stored without a config reads as its type's default.
 *
 * Power: its load, and `No heavier available` only while it is on — a row reading `Off` would only
 * say the user never pressed a button they may not know exists (10.1 FR-4).
 */
export function exerciseSettingsRows(
  exercise: Pick<Exercise, 'type' | 'config'>,
): ExerciseSettingsRow[] {
  const type = exerciseTypeOf(exercise);
  const config = exercise.config ?? defaultExerciseConfig(type);
  if (config?.type !== 'power') {
    return [];
  }
  return [
    { key: 'load', label: 'Load', value: POWER_LOAD_LABEL[config.load] },
    ...(config.noHeavierAvailable
      ? [{ key: 'noHeavier', label: powerNoHeavierLabel(config.load), value: 'On' }]
      : []),
  ];
}

/** A logged round's row label — `Round 1`. */
export function formatRoundLabel(roundLog: Pick<RoundLog, 'roundNumber'>): string {
  return `Round ${roundLog.roundNumber}`;
}

/** A logged round's value: the work it ran, `2:00` (10.1 FR-12, Artem, 27.10.2026). */
export function formatRoundValue(roundLog: Pick<RoundLog, 'workSec'>): string {
  return formatClock(roundLog.workSec);
}

/**
 * What followed the work, a step quieter: ` · rest 1:00`, ` · rest skipped`, or ` · ended early`
 * for a round cut short — that one says why it is short, which matters more than its rest.
 * `undefined` where there was no rest to take.
 */
export function formatRoundTail(
  roundLog: Pick<RoundLog, 'restSec' | 'restSkipped' | 'completed'>,
): string | undefined {
  if (!roundLog.completed) {
    return ' · ended early';
  }
  if (roundLog.restSkipped) {
    return ' · rest skipped';
  }
  return roundLog.restSec === undefined ? undefined : ` · rest ${formatClock(roundLog.restSec)}`;
}

/** One row of a performance's card — a set or a round, already read. */
export type ExerciseLogRow = { key: string; label: string; value: string; tail?: string };

/**
 * A performance's rows on the History tab: its sets, then its rounds — an exercise has one or the other (10.1 FR-12).
 */
export function exerciseLogRows(
  logs: { setLogs: readonly SetLog[]; roundLogs: readonly RoundLog[] },
  equipment?: Equipment,
  powerLoad?: PowerLoad,
): ExerciseLogRow[] {
  return [
    ...logs.setLogs.map((setLog) => ({
      key: setLog.id,
      label: formatSetLabel(setLog),
      value: formatSetValue(setLog, equipment, powerLoad),
      tail: formatSetRirTail(setLog, powerLoad),
    })),
    ...logs.roundLogs.map((roundLog) => ({
      key: roundLog.id,
      label: formatRoundLabel(roundLog),
      value: formatRoundValue(roundLog),
      tail: formatRoundTail(roundLog),
    })),
  ];
}
