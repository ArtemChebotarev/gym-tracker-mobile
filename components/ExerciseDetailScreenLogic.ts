// Pure, non-JSX logic behind ExerciseDetailScreen.tsx — see the code-style skill.

import type { Equipment } from '@domain/catalog';
import type { SetLog } from '@domain/execution';
import type { ExerciseBestSet, ExerciseLastSession } from '@domain/exerciseOverview';
import { parseUtcIso } from '@domain/time';
import { formatAbsoluteDate } from '@design/formatDate';
import { formatShortDuration } from '@design/formatShortDuration';

import { formatRir } from './WorkoutExerciseCardLogic';
import { formatLoggedWeight } from './WorkoutSetRowLogic';

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

/** The last session's line: `Week 3 · Day 2 · 12 Sep` (08.6, "Последняя сессия"). */
export function formatLastSessionTitle(lastSession: ExerciseLastSession): string {
  const date = formatAbsoluteDate(parseUtcIso(lastSession.completedAt));
  return `Week ${lastSession.weekNumber} · Day ${lastSession.dayNumber} · ${date}`;
}

/**
 * One logged set: `85 kg × 8 · 2 RIR`. `rir` is optional — with none there's no tail at all
 * (08.6: "если его нет, часть после точки не выводится").
 *
 * The weight goes through the workout row's own formatter rather than `design/formatSet`, so a
 * `bodyweight-weighted` set reads back the way it was logged — `83 (+5) kg × 8`, the body weight
 * and what was hung on it kept apart (task 105).
 */
export function formatOverviewSet(setLog: SetLog, equipment?: Equipment): string {
  const set = `${formatLoggedWeight(setLog, equipment)} kg × ${setLog.reps}`;
  return setLog.rir === undefined ? set : `${set} · ${formatRir(setLog.rir)}`;
}

/** The History link's title — `Used in 3 mesocycles` (08.6, "Переход в историю"). */
export function formatMesocyclesUsed(mesocycleCount: number): string {
  return `Used in ${mesocycleCount} ${mesocycleCount === 1 ? 'mesocycle' : 'mesocycles'}`;
}

/** The History link's subtitle — `124 sets logged all-time`. */
export function formatSetsLogged(setCount: number): string {
  return `${setCount} ${setCount === 1 ? 'set' : 'sets'} logged all-time`;
}
