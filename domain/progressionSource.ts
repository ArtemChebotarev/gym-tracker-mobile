// Progression engine — which session the next week is planned from. See 03 · Progression
// Engine, "Ленивая генерация по дням" and "Граничные случаи". Finishing or skipping week W,
// day D plans week W + 1, day D; this picks the base `prescribeNextSession` then works from.

import type { Session } from '@domain/execution';

type SessionSlot = Pick<Session, 'mesoId' | 'weekNumber' | 'dayNumber' | 'status'>;

export type BaseSessionResolution<S extends SessionSlot> =
  { status: 'awaiting_source' } | { status: 'ready'; base: S };

/**
 * The base for planning the session after `trigger`, from the sessions of the same mesocycle
 * (any days, any order — others are ignored):
 *
 * - `trigger` not final yet (`planned` / `in_progress`): `awaiting_source` — the next week
 *   is not generated.
 * - `trigger` completed: `trigger` itself, with its fact.
 * - `trigger` skipped: the latest completed session of the same day before it, so several
 *   skips in a row still go back to the last real fact. With none, the day's week 1 session —
 *   a skipped session never has `SetLog`s (05 · Workout Execution & Logging, "Пропустить
 *   тренировку"), so the plan is week 1's start values, carried over unchanged.
 */
export function resolveBaseSession<S extends SessionSlot>(
  trigger: S,
  mesoSessions: readonly S[],
): BaseSessionResolution<S> {
  if (trigger.status === 'completed') {
    return { status: 'ready', base: trigger };
  }
  if (trigger.status !== 'skipped') {
    return { status: 'awaiting_source' };
  }

  const earlierSameDay = mesoSessions.filter(
    (session) =>
      session.mesoId === trigger.mesoId &&
      session.dayNumber === trigger.dayNumber &&
      session.weekNumber <= trigger.weekNumber,
  );
  const lastCompleted = earlierSameDay
    .filter((session) => session.status === 'completed')
    .reduce<S | undefined>(
      (latest, session) =>
        latest === undefined || session.weekNumber > latest.weekNumber ? session : latest,
      undefined,
    );
  if (lastCompleted !== undefined) {
    return { status: 'ready', base: lastCompleted };
  }

  const weekOne =
    trigger.weekNumber === 1 ? trigger : earlierSameDay.find((session) => session.weekNumber === 1);
  if (weekOne === undefined) {
    throw new Error(
      `No week 1 session for mesoId "${trigger.mesoId}", day ${trigger.dayNumber} to plan from.`,
    );
  }
  return { status: 'ready', base: weekOne };
}
