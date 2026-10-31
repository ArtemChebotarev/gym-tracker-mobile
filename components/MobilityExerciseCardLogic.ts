// Pure helpers behind components/MobilityBlockRow.tsx — 10.1 FR-9, FR-10, FR-14 (GT-107). A
// mobility exercise is one block with a length: picked on the card the first time, from history
// after that, run on the interval timer as one round with no rest, and logged — Done — with the
// timer or without it. See the code-style skill.

import type { RoundEntry } from '@domain/executionValidators';
import type { IntervalTimer, IntervalTimerRound } from '@domain/intervalTimer';
import { intervalPhaseRemainingSec, isIntervalTimerRunning } from '@domain/intervalTimerRules';
import { ROUND_TIME_BOUNDS } from '@domain/roundTimes';
import type { WorkoutRoundRow } from '@usecases/workoutSession';

export const DURATION_COLUMN = 'Duration';

/** The picker's title. */
export const DURATION_PICKER_TITLE = DURATION_COLUMN;

/** The block's length is picked on the work time's wheels — the same field as an interval's Work. */
export const LENGTH_PICKER = ROUND_TIME_BOUNDS.work;

/** The line under the block while it has no length (FR-9): why Done and the timer wait. */
export const PICK_DURATION_HINT = 'Pick a duration to mark it done or start the timer.';

/**
 * The length the field shows: what was logged once it is, else one picked on this visit, else the
 * block's plan (from history). `undefined`: none yet — the field is empty.
 */
export function blockLengthSec(
  block: WorkoutRoundRow,
  pickedSec: number | undefined,
): number | undefined {
  return block.log?.workSec ?? pickedSec ?? block.workSec;
}

/** What Done logs by hand (FR-10): the length the field shows, and no rest — mobility has none. */
export function blockEntryOf(lengthSec: number | undefined): RoundEntry | undefined {
  return lengthSec === undefined ? undefined : { workSec: lengthSec };
}

/** The one round the timer runs for the block: its length, no rest after it (FR-10). */
export function timerBlockOf(
  block: WorkoutRoundRow,
  lengthSec: number | undefined,
): IntervalTimerRound[] | undefined {
  return lengthSec === undefined
    ? undefined
    : [{ roundNumber: block.roundNumber, workSec: lengthSec, restSec: 0 }];
}

/** Where this block's timer is: not out, counting down, or paused. */
export type BlockTimerState = 'idle' | 'running' | 'paused';

/** The state of `timer` — this block's, if any — as the timer action shows it. Over is idle. */
export function blockTimerState(timer: IntervalTimer | undefined): BlockTimerState {
  if (timer?.phase === undefined) return 'idle';
  return isIntervalTimerRunning(timer) ? 'running' : 'paused';
}

/** The timer action's words in each state (GT-206). */
export const BLOCK_TIMER_LABEL: Record<BlockTimerState, string> = {
  idle: 'Start timer',
  running: 'Pause timer',
  paused: 'Resume timer',
};

/**
 * What the Duration field shows while the block's timer is out (canvas 1.x, CooldownStates: the time
 * left in the row, no bar — the progress is the timer screen's and the capsule's): the time left of
 * the block, or its whole length during the Get ready before it.
 */
export function shownTimerSec(timer: IntervalTimer, lengthSec: number, now: number): number {
  return timer.phase?.kind === 'work' ? intervalPhaseRemainingSec(timer, now) : lengthSec;
}
