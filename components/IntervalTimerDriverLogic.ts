import type { IntervalRoundResult, IntervalTimer } from '@domain/intervalTimer';
import { intervalPhaseRemainingMs } from '@domain/intervalTimerRules';
import { msUntilSecondChanges } from '@domain/time';

/**
 * Milliseconds until the running phase's time on screen next changes — the next whole second, or
 * the phase's end: when the timer is moved on and redrawn, in the capsule and on the full screen.
 */
export function msToNextSecond(timer: IntervalTimer, now: number): number {
  return msUntilSecondChanges(intervalPhaseRemainingMs(timer, now));
}

// What the interval timer's driver (IntervalTimerDriver.tsx) reacts to — pure.

/**
 * The running phase as one value, `undefined` while paused or over: it changes exactly when a new
 * phase starts or a paused one runs again (its end moves) — the moments the countdown is set again.
 */
export function runningPhaseKey(timer: IntervalTimer | undefined): string | undefined {
  if (timer?.phase === undefined || timer.endsAt === undefined) return undefined;
  return `${timer.phase.kind}:${timer.phase.round}:${timer.endsAt}`;
}

/**
 * The rounds to write as the timer goes from `before` to `after` (GT-98): each result that is new
 * — a round whose work just ended, or one ended early — or changed — its rest over, skipped or cut
 * short. A timer that was not running before (a new one) has nothing written yet.
 */
export function roundsToLog(
  before: IntervalTimer | undefined,
  after: IntervalTimer | undefined,
): IntervalRoundResult[] {
  if (after === undefined) return [];
  const written = new Map((before?.results ?? []).map((result) => [result.roundNumber, result]));
  return after.results.filter((result) => {
    const was = written.get(result.roundNumber);
    return (
      was === undefined ||
      was.workSec !== result.workSec ||
      was.restSec !== result.restSec ||
      was.restSkipped !== result.restSkipped ||
      was.completed !== result.completed
    );
  });
}

/**
 * Whether going from `before` to `after` is a new phase or the end of the block — the moments the
 * phone buzzes (FR-6: "сигналы на старт работы и отдыха; звук и вибрация"). A pause, a resume or the
 * timer's very start are not.
 */
export function phaseChanged(
  before: IntervalTimer | undefined,
  after: IntervalTimer | undefined,
): boolean {
  if (before === undefined || after === undefined) return false;
  if (before.outcome === undefined && after.outcome === 'done') return true;
  const was = before.phase;
  const now = after.phase;
  if (was === undefined || now === undefined) return false;
  return was.kind !== now.kind || was.round !== now.round;
}
