// Mesocycle lifecycle rules — 04 · Meso Creation Flows, "Завершение мезоцикла"; 05 · Workout
// Execution & Logging, "Остановить мезоцикл" (task 052). The counterpart of
// domain/sessionLifecycle.ts one level up: a block ends the way a session does — `completed` when
// its work is done, `abandoned` when it is called off — and neither end can be left again.
//
// A block never closes itself. The spec's third path, auto-completion once the deload week's
// sessions are all final, was dropped on review (Artem, 2026-09-21): a block that quietly ends
// itself is a block you can't look at one more time before it goes, and RP's own app asks for the
// word too. What is left of it is `canFinishMesocycle` — the moment the `Finish mesocycle` button
// appears, with the last press still the user's.
//
// Pure: the use case layer reads the mesocycle and its sessions and persists the outcome.

import { ConflictError } from '@domain/errors';
import type { Session } from '@domain/execution';
import type { Mesocycle, MesocycleStatus } from '@domain/mesocycle';
import { isFinalSession } from '@domain/sessionLifecycle';

/** `completed` and `abandoned` can't be left or changed (02 · Domain Model, "Mesocycle"). */
export const FINAL_MESOCYCLE_STATUSES: readonly MesocycleStatus[] = ['completed', 'abandoned'];

export function isFinalMesocycle(mesocycle: Pick<Mesocycle, 'status'>): boolean {
  return FINAL_MESOCYCLE_STATUSES.includes(mesocycle.status);
}

/** Whether the block has been archived — put out of sight, `Mesocycle.archivedAt`. */
export function isArchivedMesocycle(mesocycle: Pick<Mesocycle, 'archivedAt'>): boolean {
  return mesocycle.archivedAt !== undefined;
}

/**
 * Every block that has ended — finished or stopped — newest end first, archived ones left out.
 * Both ways out leave a block that happened and weeks worth copying, so neither *status* is
 * filtered away here; a stopped one is told apart where it's shown, by its badge (08.3).
 *
 * Two screens ask this exact question and must not answer it differently: 08.3's Completed group
 * (074) and Flow C's source-mesocycle dropdown (124, 08.8 — "`Mesocycle` со `status = completed`
 * или `abandoned`, как в секции Completed на 08.3"). A block with no `completedAt` sorts last
 * rather than throwing off the order — the field is set by both closing actions (052), so this
 * only covers a record that predates them.
 *
 * Archiving hides a block from both at once, and does so from here on purpose: two call sites that
 * each remembered to skip archived blocks would be two chances to forget. Hidden means hidden —
 * a block the user took off the list has no business turning up in the dropdown that plans the
 * next one (Artem, 25.09.2026).
 */
export function finishedMesocyclesNewestFirst(mesocycles: readonly Mesocycle[]): Mesocycle[] {
  return mesocycles
    .filter((mesocycle) => isFinalMesocycle(mesocycle) && !isArchivedMesocycle(mesocycle))
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
}

/**
 * Archives `mesocycle` as of `now` — pure, returns the record to save. Nothing but `archivedAt`
 * moves: the block keeps its status, its `completedAt` and every row under it (see
 * `Mesocycle.archivedAt`).
 *
 * Throws `ConflictError` unless the block has ended. Archiving is offered on the Completed group
 * only (08.3): an `active` block is stopped or finished first, and a `planned` one is deleted —
 * it has no history to preserve, which is the whole reason archiving exists instead of a delete.
 * Archiving an already-archived block is refused too, so the original `archivedAt` can't be
 * quietly overwritten by a second tap.
 */
export function archivedMesocycle(mesocycle: Mesocycle, now: string): Mesocycle {
  if (!isFinalMesocycle(mesocycle)) {
    throw new ConflictError(
      `Mesocycle "${mesocycle.id}" is ${mesocycle.status}; only a finished or stopped one can be archived.`,
    );
  }
  if (isArchivedMesocycle(mesocycle)) {
    throw new ConflictError(`Mesocycle "${mesocycle.id}" is already archived.`);
  }
  return { ...mesocycle, archivedAt: now };
}

/**
 * How a block ends: `completed` by Finish mesocycle, once nothing is left to train, `abandoned` by
 * Stop mesocycle, at any point. Both stamp `completedAt` — 08.3's Completed card reads it as the
 * block's end date either way.
 */
export type MesocycleClosure = Extract<MesocycleStatus, 'completed' | 'abandoned'>;

/**
 * Throws `ConflictError` unless `mesocycle` is `active` — the only status either closing action
 * applies to. A `planned` one is deleted rather than finished (08.3), and a closed one is closed.
 */
export function assertMesocycleActive(mesocycle: Mesocycle): void {
  if (mesocycle.status !== 'active') {
    throw new ConflictError(
      `Mesocycle "${mesocycle.id}" is ${mesocycle.status}; only an active one can be closed.`,
    );
  }
}

/**
 * The block's sessions that still have training left in them — anything not `completed` or
 * `skipped`. Sessions of other mesocycles are ignored, so the whole list may be passed in.
 */
export function unfinishedSessions<S extends Session>(
  mesocycle: Pick<Mesocycle, 'id'>,
  sessions: readonly S[],
): S[] {
  return sessions.filter(
    (session) => session.mesoId === mesocycle.id && !isFinalSession(session),
  );
}

/**
 * Whether `Finish mesocycle` is offered (08.7, the button under the last workout): the block is
 * `active` and every session it has is final. Lazy generation makes that exact — a week is only
 * programmed once the same day of the week before it is done, so the last deload session finishing
 * leaves nothing behind it.
 *
 * A block with work left is only left through Stop, which is destructive and says so.
 */
export function canFinishMesocycle(mesocycle: Mesocycle, sessions: readonly Session[]): boolean {
  return mesocycle.status === 'active' && unfinishedSessions(mesocycle, sessions).length === 0;
}

/** `mesocycle` closed as `closure`, with `completedAt = now`. */
export function closedMesocycle(
  mesocycle: Mesocycle,
  closure: MesocycleClosure,
  now: string,
): Mesocycle {
  return { ...mesocycle, status: closure, completedAt: now };
}
