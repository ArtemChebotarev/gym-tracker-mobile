// The interval timer (10.1 FR-6, GT-95): Get ready → work → rest → … → done, with pause, skip rest
// and end early. Types only; the transitions live beside it in `intervalTimerRules.ts`.
//
// Like the rest timer, times are epoch milliseconds from a clock the caller reads: the rules take
// `now`, so they run the same on a fake clock as on the phone, and a timer that ran while the app
// slept is right when it wakes — a phase is over when its end has passed, however many ticks were
// missed, and every phase starts exactly where the one before ended.
//
// The block ends with its last round (Artem, 19.10.2026): no rest follows it. The rest before the
// next exercise is the ordinary rest timer, after the summary screen (FR-5).

import type { RoundLog } from './execution';

/** One round the timer runs: its place in the exercise and its own times (FR-9 lets them differ). */
export type IntervalTimerRound = {
  roundNumber: number;
  workSec: number;
  /** The rest after this round. Unused after the last round of the block. 0 is no rest. */
  restSec: number;
};

/**
 * Where the timer is. `round` indexes `IntervalTimer.rounds`: the round a Get ready leads into, the
 * round being worked, or the round a rest follows.
 */
export type IntervalTimerPhase =
  | { kind: 'getReady'; round: number }
  | { kind: 'work'; round: number }
  | { kind: 'rest'; round: number };

/**
 * What a round turned out to be — what the timer logs (FR-7): actual work, actual rest, whether
 * the rest was skipped, whether the round was done or ended early. Whole seconds.
 */
export type IntervalRoundResult = Pick<
  RoundLog,
  'roundNumber' | 'workSec' | 'restSec' | 'restSkipped' | 'completed'
>;

/**
 * A running, paused or finished interval timer. While a phase runs exactly one of `endsAt` /
 * `remainingMs` is set, as with the rest timer; once done, `phase` is absent.
 */
export type IntervalTimer = {
  /** The rounds of the block, from the first one not yet logged (FR-7). Never empty. */
  rounds: readonly IntervalTimerRound[];
  /** Get ready before a round started by a tap — Start timer, Skip rest. 0 is none. */
  getReadySec: number;
  /** The phase running or paused; absent once the block is over. */
  phase?: IntervalTimerPhase;
  /** The whole phase, milliseconds. */
  durationMs: number;
  /** Running: when the phase ends. */
  endsAt?: number;
  /** Paused: what was left of the phase when it was paused. */
  remainingMs?: number;
  /** The rounds the timer has been through so far, in order — work done, then its rest. */
  results: readonly IntervalRoundResult[];
  /** How the block ended: all rounds done, or cut short. Absent while it runs. */
  outcome?: 'done' | 'endedEarly';
};
