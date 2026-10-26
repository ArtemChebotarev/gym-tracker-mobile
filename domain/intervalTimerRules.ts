// The transitions of the interval timer (10.1 FR-6, GT-95) — see `intervalTimer.ts` for the types.
//
// - Get ready → work → rest → work → … → the last round's work → done. Get ready of its own only
//   before a round started by a tap: the first one (Start timer) and one after Skip rest. After an
//   ordinary rest there is none: the rest's last `getReadySec` are its Get ready — shown as one,
//   still the rest, which is no longer for it (GT-176; `intervalPhaseShown`). A rest of 0 is no
//   rest. No rest after the last round: the
//   timer is over, and its rest is the ordinary rest timer's, after the summary (FR-6). The last
//   round done is logged with that rest all the same — the one its field holds, as a round logged
//   by hand is — so a rest changed in the workout reaches next week (FR-8; Artem, 20.10.2026).
// - Pause holds the phase; resume runs it on with what was left.
// - Skip rest: a one-off — the rest is logged as taken so far and marked skipped, then Get ready
//   and the next round. Skipped in the rest's Get ready, the next round starts at once: the Get
//   ready was already running (Artem, 26.10.2026).
// - End early: the round being worked is logged with the time it ran and counted as not done; a
//   rest cut short is logged with the time it ran. Nothing is logged for the rounds after.
// - Every transition first catches up with `now` (`intervalTimerAt`), so an action after the app
//   slept acts on the phase that is really running.
//
// The countdown and its signal (FR-6: beeps in the last 3 s, a signal as work and rest start) are
// not the timer's: a running phase's `endsAt` is what state/intervalSignal.ts aims at.

import type {
  IntervalRoundResult,
  IntervalTimer,
  IntervalTimerPhase,
  IntervalTimerRound,
} from './intervalTimer';
import { assertIntervalTimerStart } from './intervalTimerValidators';

const MS_PER_SEC = 1000;

function roundAt(timer: IntervalTimer, index: number): IntervalTimerRound {
  const round = timer.rounds[index];
  if (round === undefined) {
    throw new Error(`The interval timer has no round ${index + 1}.`);
  }
  return round;
}

function phaseSec(timer: IntervalTimer, phase: IntervalTimerPhase): number {
  switch (phase.kind) {
    case 'getReady':
      return timer.getReadySec;
    case 'work':
      return roundAt(timer, phase.round).workSec;
    case 'rest':
      return roundAt(timer, phase.round).restSec;
  }
}

/** `timer` in `phase`, running from `startsAt`. A phase of 0 s is passed straight through. */
function enter(timer: IntervalTimer, phase: IntervalTimerPhase, startsAt: number): IntervalTimer {
  const durationMs = phaseSec(timer, phase) * MS_PER_SEC;
  const { remainingMs: _remainingMs, ...rest } = timer;
  const entered: IntervalTimer = { ...rest, phase, durationMs, endsAt: startsAt + durationMs };
  return durationMs === 0 ? finishPhase(entered) : entered;
}

/** The block is over: no phase left, the results as they stand. */
function finish(timer: IntervalTimer, outcome: 'done' | 'endedEarly'): IntervalTimer {
  return {
    rounds: timer.rounds,
    getReadySec: timer.getReadySec,
    durationMs: 0,
    results: timer.results,
    outcome,
  };
}

/** `results` with the rest after round `roundNumber` set, as long as that round has a result. */
function withRest(
  results: readonly IntervalRoundResult[],
  roundNumber: number,
  restSec: number,
  restSkipped: boolean,
): IntervalRoundResult[] {
  return results.map((result) =>
    result.roundNumber === roundNumber ? { ...result, restSec, restSkipped } : result,
  );
}

/** The running phase ran its full length, ending at its `endsAt`: on to the next one. */
function finishPhase(timer: IntervalTimer): IntervalTimer {
  const { phase, endsAt } = timer;
  if (phase === undefined || endsAt === undefined) {
    return timer;
  }
  const isLast = phase.round === timer.rounds.length - 1;
  switch (phase.kind) {
    case 'getReady':
      return enter(timer, { kind: 'work', round: phase.round }, endsAt);
    case 'work': {
      const round = roundAt(timer, phase.round);
      const done: IntervalTimer = {
        ...timer,
        results: [
          ...timer.results,
          {
            roundNumber: round.roundNumber,
            workSec: round.workSec,
            restSkipped: false,
            completed: true,
          },
        ],
      };
      if (isLast) {
        return finish(
          round.restSec > 0
            ? { ...done, results: withRest(done.results, round.roundNumber, round.restSec, false) }
            : done,
          'done',
        );
      }
      return round.restSec > 0
        ? enter(done, { kind: 'rest', round: phase.round }, endsAt)
        : enter(done, { kind: 'work', round: phase.round + 1 }, endsAt);
    }
    case 'rest': {
      const round = roundAt(timer, phase.round);
      const rested: IntervalTimer = {
        ...timer,
        results: withRest(timer.results, round.roundNumber, round.restSec, false),
      };
      return enter(rested, { kind: 'work', round: phase.round + 1 }, endsAt);
    }
  }
}

/**
 * Starts a timer over `rounds` (from the first round not yet logged) at `now`: Get ready first,
 * then the first round's work — or the work at once when Get ready is 0.
 */
export function startIntervalTimer(
  rounds: readonly IntervalTimerRound[],
  getReadySec: number,
  now: number,
): IntervalTimer {
  assertIntervalTimerStart(rounds, getReadySec);
  const timer: IntervalTimer = { rounds, getReadySec, durationMs: 0, results: [] };
  return enter(timer, { kind: 'getReady', round: 0 }, now);
}

/** Whether a phase is counting down rather than paused or over. */
export function isIntervalTimerRunning(timer: IntervalTimer): boolean {
  return timer.phase !== undefined && timer.endsAt !== undefined;
}

/** Whether the block is over, whichever way it ended. */
export function isIntervalTimerOver(timer: IntervalTimer): boolean {
  return timer.outcome !== undefined;
}

/**
 * The timer as it is at `now`: every phase whose end has passed is finished, each next one
 * starting where the one before ended. A paused or finished timer is as it was.
 */
export function intervalTimerAt(timer: IntervalTimer, now: number): IntervalTimer {
  let current = timer;
  while (isIntervalTimerRunning(current) && current.endsAt !== undefined && now >= current.endsAt) {
    current = finishPhase(current);
  }
  return current;
}

/**
 * Milliseconds left of the phase at `now` (after `intervalTimerAt`), never below 0 nor above the
 * phase itself — a `now` read a moment before the phase began still shows it whole, not `2:01`.
 */
export function intervalPhaseRemainingMs(timer: IntervalTimer, now: number): number {
  if (timer.phase === undefined) return 0;
  const left = timer.endsAt !== undefined ? timer.endsAt - now : (timer.remainingMs ?? 0);
  return Math.min(timer.durationMs, Math.max(0, left));
}

/** Whole seconds left as the timer shows them: 0.2 s to go still reads 0:01. */
export function intervalPhaseRemainingSec(timer: IntervalTimer, now: number): number {
  return Math.ceil(intervalPhaseRemainingMs(timer, now) / MS_PER_SEC);
}

/** The Get ready a rest ends with: its last `getReadySec`, or all of a shorter one (GT-176). */
function restTailMs(timer: IntervalTimer): number {
  return Math.min(timer.getReadySec * MS_PER_SEC, timer.durationMs);
}

/** Whether `timer` is in a rest's last seconds at `now` — the ones that run as its Get ready. */
export function isInIntervalRestTail(timer: IntervalTimer, now: number): boolean {
  if (timer.phase?.kind !== 'rest') return false;
  const tailMs = restTailMs(timer);
  return tailMs > 0 && intervalPhaseRemainingMs(timer, now) <= tailMs;
}

/** A phase as the timer shows it: what it is called and how long it is. */
export type IntervalShownPhase = { kind: IntervalTimerPhase['kind']; durationMs: number };

/**
 * The phase as the timer shows it at `now`: the one running — except a rest's last seconds, which
 * are a Get ready of their own length (GT-176), ending where the rest ends. `undefined` once over.
 */
export function intervalPhaseShown(
  timer: IntervalTimer,
  now: number,
): IntervalShownPhase | undefined {
  if (timer.phase === undefined) return undefined;
  return isInIntervalRestTail(timer, now)
    ? { kind: 'getReady', durationMs: restTailMs(timer) }
    : { kind: timer.phase.kind, durationMs: timer.durationMs };
}

/**
 * The share of the phase still to go, 0..1 — what the ring is filled with. A rest's Get ready
 * fills it anew: the share of the Get ready, not of the rest.
 */
export function intervalPhaseProgress(timer: IntervalTimer, now: number): number {
  const durationMs = intervalPhaseShown(timer, now)?.durationMs ?? 0;
  return durationMs > 0 ? Math.min(1, intervalPhaseRemainingMs(timer, now) / durationMs) : 0;
}

/** Milliseconds of the phase gone by at `now`. */
function elapsedMs(timer: IntervalTimer, now: number): number {
  return timer.durationMs - intervalPhaseRemainingMs(timer, now);
}

/** The timer held where it is at `now`. Pausing a paused or finished timer changes nothing. */
export function pauseIntervalTimer(timer: IntervalTimer, now: number): IntervalTimer {
  const current = intervalTimerAt(timer, now);
  if (!isIntervalTimerRunning(current)) return current;
  const { endsAt: _endsAt, ...rest } = current;
  return { ...rest, remainingMs: intervalPhaseRemainingMs(current, now) };
}

/** The timer running again from `now` with what was left. Resuming a running one changes nothing. */
export function resumeIntervalTimer(timer: IntervalTimer, now: number): IntervalTimer {
  if (timer.phase === undefined || isIntervalTimerRunning(timer)) return timer;
  const { remainingMs, ...rest } = timer;
  return { ...rest, endsAt: now + (remainingMs ?? 0) };
}

/**
 * Skip rest at `now`: the rest so far is logged and marked skipped, then Get ready and the next
 * round, running — from a paused rest too. From the rest's own Get ready (its last seconds), the
 * next round at once, with no second one. Outside a rest it changes nothing.
 */
export function skipIntervalRest(timer: IntervalTimer, now: number): IntervalTimer {
  const current = intervalTimerAt(timer, now);
  const phase = current.phase;
  if (phase?.kind !== 'rest') return current;
  const round = roundAt(current, phase.round);
  const skipped: IntervalTimer = {
    ...current,
    results: withRest(
      current.results,
      round.roundNumber,
      Math.round(elapsedMs(current, now) / MS_PER_SEC),
      true,
    ),
  };
  const next = phase.round + 1;
  return isInIntervalRestTail(current, now)
    ? enter(skipped, { kind: 'work', round: next }, now)
    : enter(skipped, { kind: 'getReady', round: next }, now);
}

/**
 * End early at `now` — after the user confirmed it (FR-6). The round being worked is logged with
 * the whole seconds it ran and counted as not done; one cut short before its first second is not
 * logged at all, as there is no time to log. A rest cut short is logged with the time it ran.
 * Nothing is logged for the rounds after. A timer already over is as it was.
 */
export function endIntervalTimerEarly(timer: IntervalTimer, now: number): IntervalTimer {
  const current = intervalTimerAt(timer, now);
  const phase = current.phase;
  if (phase === undefined) return current;
  const round = roundAt(current, phase.round);
  const ranSec = Math.round(elapsedMs(current, now) / MS_PER_SEC);
  let results = current.results;
  if (phase.kind === 'work' && ranSec >= 1) {
    results = [
      ...results,
      { roundNumber: round.roundNumber, workSec: ranSec, restSkipped: false, completed: false },
    ];
  } else if (phase.kind === 'rest') {
    results = withRest(results, round.roundNumber, ranSec, false);
  }
  return finish({ ...current, results }, 'endedEarly');
}
