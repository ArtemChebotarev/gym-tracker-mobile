// Pure, non-JSX logic behind ExerciseDetailScreen.tsx — see the code-style skill.

import type { Equipment } from '@domain/catalog';
import type { SetLog } from '@domain/execution';
import type {
  ExerciseBestSet,
  ExerciseLastSession,
  ExerciseSessionSummary,
} from '@domain/exerciseOverview';
import { parseUtcIso } from '@domain/time';
import { formatAbsoluteDate } from '@design/formatDate';
import { formatRir } from '@design/formatRir';
import { formatShortDuration } from '@design/formatShortDuration';

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
 */
export function formatSetValue(setLog: SetLog, equipment?: Equipment): string {
  return `${formatLoggedWeight(setLog, equipment)} kg × ${setLog.reps}`;
}

/**
 * The ` · 2 RIR` tail, or `undefined` when the set has no `rir` — 08.6: "если его нет, часть после
 * точки не выводится", so there is no tail at all rather than an empty one.
 */
export function formatSetRirTail(setLog: SetLog): string | undefined {
  return setLog.rir === undefined ? undefined : ` · ${formatRir(setLog.rir)}`;
}

/** An earlier session's left side — `W2 · D1 · 3 Aug` (the mockup's compact form). */
export function formatEarlierSessionLabel(session: ExerciseSessionSummary): string {
  const date = formatAbsoluteDate(parseUtcIso(session.completedAt));
  return `W${session.weekNumber} · D${session.dayNumber} · ${date}`;
}

/** An earlier session's right side — `80 × 8`, its heaviest set, no unit. */
export function formatEarlierSessionValue(session: ExerciseSessionSummary): string {
  return `${session.bestSet.weight} × ${session.bestSet.reps}`;
}

/** The quieter tail after it — ` · 3 sets`. */
export function formatEarlierSessionTail(session: ExerciseSessionSummary): string {
  return ` · ${session.setCount} ${session.setCount === 1 ? 'set' : 'sets'}`;
}
