import { phaseChanged, runningPhaseKey } from '@components/IntervalTimerDriverLogic';
import {
  endIntervalTimerEarly,
  intervalTimerAt,
  pauseIntervalTimer,
  resumeIntervalTimer,
  startIntervalTimer,
} from '@domain/intervalTimerRules';

const T0 = 1_000_000;
const S = 1000;
const ROUNDS = [1, 2].map((roundNumber) => ({ roundNumber, workSec: 60, restSec: 30 }));
const start = startIntervalTimer(ROUNDS, 5, T0);

describe('runningPhaseKey', () => {
  test('changes with each new phase, and when a paused one runs again', () => {
    const keys = [
      runningPhaseKey(start),
      runningPhaseKey(intervalTimerAt(start, T0 + 5 * S)),
      runningPhaseKey(intervalTimerAt(start, T0 + 65 * S)),
    ];
    expect(new Set(keys).size).toBe(3);

    const paused = pauseIntervalTimer(start, T0 + S);
    const resumed = resumeIntervalTimer(paused, T0 + 10 * S);
    expect(runningPhaseKey(resumed)).not.toBe(runningPhaseKey(start));
  });

  test('none while paused, over or absent', () => {
    expect(runningPhaseKey(pauseIntervalTimer(start, T0 + S))).toBeUndefined();
    expect(runningPhaseKey(endIntervalTimerEarly(start, T0 + S))).toBeUndefined();
    expect(runningPhaseKey(undefined)).toBeUndefined();
  });
});

describe('phaseChanged', () => {
  test('a new phase and the end of the block are changes', () => {
    expect(phaseChanged(start, intervalTimerAt(start, T0 + 5 * S))).toBe(true);
    const lastWork = intervalTimerAt(start, T0 + (5 + 60 + 30) * S);
    expect(phaseChanged(lastWork, intervalTimerAt(start, T0 + 10_000 * S))).toBe(true);
  });

  test('a pause, a resume, the start and End early are not', () => {
    const paused = pauseIntervalTimer(start, T0 + S);
    expect(phaseChanged(start, paused)).toBe(false);
    expect(phaseChanged(paused, resumeIntervalTimer(paused, T0 + 2 * S))).toBe(false);
    expect(phaseChanged(undefined, start)).toBe(false);
    expect(phaseChanged(start, endIntervalTimerEarly(start, T0 + S))).toBe(false);
  });
});
