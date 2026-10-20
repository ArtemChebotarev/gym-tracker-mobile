import type { IntervalTimer } from '@domain/intervalTimer';

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
