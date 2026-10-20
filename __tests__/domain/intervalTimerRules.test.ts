import type { IntervalTimer, IntervalTimerRound } from '@domain/intervalTimer';
import {
  endIntervalTimerEarly,
  intervalPhaseProgress,
  intervalPhaseRemainingMs,
  intervalPhaseRemainingSec,
  intervalPhasesAhead,
  intervalTimerAt,
  isIntervalTimerOver,
  isIntervalTimerRunning,
  pauseIntervalTimer,
  resumeIntervalTimer,
  skipIntervalRest,
  startIntervalTimer,
} from '@domain/intervalTimerRules';

const T0 = 1_000_000;
const S = 1000;

/** Heavy bag (10.1): 3 × 2:00, rest 1:00, Get ready 0:05 — rounds numbered from 1. */
const HEAVY_BAG: IntervalTimerRound[] = [1, 2, 3].map((roundNumber) => ({
  roundNumber,
  workSec: 120,
  restSec: 60,
}));

function phaseOf(timer: IntervalTimer) {
  return timer.phase === undefined ? 'over' : `${timer.phase.kind} ${timer.phase.round + 1}`;
}

describe('startIntervalTimer', () => {
  test('starts with Get ready before the first round, running', () => {
    const timer = startIntervalTimer(HEAVY_BAG, 5, T0);
    expect(phaseOf(timer)).toBe('getReady 1');
    expect(timer.endsAt).toBe(T0 + 5 * S);
    expect(isIntervalTimerRunning(timer)).toBe(true);
    expect(timer.results).toEqual([]);
  });

  test('a Get ready of 0 starts the first round at once', () => {
    const timer = startIntervalTimer(HEAVY_BAG, 0, T0);
    expect(phaseOf(timer)).toBe('work 1');
    expect(timer.endsAt).toBe(T0 + 120 * S);
  });

  test('starts from whichever round comes first — the first one not yet logged (FR-7)', () => {
    const timer = intervalTimerAt(
      startIntervalTimer(HEAVY_BAG.slice(1), 5, T0),
      T0 + 5 * S + 120 * S,
    );
    expect(timer.results).toEqual([
      { roundNumber: 2, workSec: 120, restSkipped: false, completed: true },
    ]);
  });

  test('refuses what it cannot run: no rounds, or times that are no whole seconds', () => {
    expect(() => startIntervalTimer([], 5, T0)).toThrow(/at least one round/);
    expect(() => startIntervalTimer([{ roundNumber: 1, workSec: 0, restSec: 60 }], 5, T0)).toThrow(
      /Work/,
    );
    expect(() => startIntervalTimer([{ roundNumber: 1, workSec: 30, restSec: -1 }], 5, T0)).toThrow(
      /Rest/,
    );
    expect(() => startIntervalTimer(HEAVY_BAG, 2.5, T0)).toThrow(/Get ready/);
  });
});

describe('intervalTimerAt — the phases in order', () => {
  test('Get ready → work → rest → work → rest → work → done, each ending where the last did', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    const seen: string[] = [];
    let at = T0;
    for (const sec of [5, 120, 60, 120, 60, 120]) {
      const timer = intervalTimerAt(start, at);
      seen.push(phaseOf(timer));
      at += sec * S;
    }
    seen.push(phaseOf(intervalTimerAt(start, at)));
    expect(seen).toEqual(['getReady 1', 'work 1', 'rest 1', 'work 2', 'rest 2', 'work 3', 'over']);
  });

  test('no Get ready after an ordinary rest, and no rest after the last round', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    const afterRest = intervalTimerAt(start, T0 + (5 + 120 + 60) * S);
    expect(phaseOf(afterRest)).toBe('work 2');

    const lastWorkEnds = T0 + (5 + 120 + 60 + 120 + 60 + 120) * S;
    expect(phaseOf(intervalTimerAt(start, lastWorkEnds - 1))).toBe('work 3');
    const over = intervalTimerAt(start, lastWorkEnds);
    expect(isIntervalTimerOver(over)).toBe(true);
    expect(over.outcome).toBe('done');
  });

  test('a finished block logs every round done — the last with its rest, still to come', () => {
    const over = intervalTimerAt(startIntervalTimer(HEAVY_BAG, 5, T0), T0 + 10_000 * S);
    expect(over.results).toEqual([
      { roundNumber: 1, workSec: 120, restSec: 60, restSkipped: false, completed: true },
      { roundNumber: 2, workSec: 120, restSec: 60, restSkipped: false, completed: true },
      // The rest before the next exercise, as the round's field holds it (Artem, 20.10.2026).
      { roundNumber: 3, workSec: 120, restSec: 60, restSkipped: false, completed: true },
    ]);
  });

  test('catches up across many phases at once — an app that slept through them', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    // Into round 2's work by 30 s, read once.
    const timer = intervalTimerAt(start, T0 + (5 + 120 + 60 + 30) * S);
    expect(phaseOf(timer)).toBe('work 2');
    expect(intervalPhaseRemainingSec(timer, T0 + (5 + 120 + 60 + 30) * S)).toBe(90);
    expect(timer.results).toHaveLength(1);
  });

  test('a rest of 0 is no rest: the next round starts as the last one ends', () => {
    const rounds = [
      { roundNumber: 1, workSec: 30, restSec: 0 },
      { roundNumber: 2, workSec: 30, restSec: 0 },
    ];
    const timer = intervalTimerAt(startIntervalTimer(rounds, 0, T0), T0 + 30 * S);
    expect(phaseOf(timer)).toBe('work 2');
    expect(timer.endsAt).toBe(T0 + 60 * S);
    expect(timer.results[0]).toEqual({
      roundNumber: 1,
      workSec: 30,
      restSkipped: false,
      completed: true,
    });
  });

  test('rounds keep their own times (FR-9)', () => {
    const rounds = [
      { roundNumber: 1, workSec: 30, restSec: 45 },
      { roundNumber: 2, workSec: 40, restSec: 60 },
    ];
    const timer = intervalTimerAt(startIntervalTimer(rounds, 0, T0), T0 + (30 + 45) * S);
    expect(phaseOf(timer)).toBe('work 2');
    expect(timer.endsAt).toBe(T0 + (30 + 45 + 40) * S);
  });
});

describe('intervalPhasesAhead', () => {
  test('from the phase running to the last work, each starting where the one before ends', () => {
    const ahead = intervalPhasesAhead(
      intervalTimerAt(startIntervalTimer(HEAVY_BAG, 5, T0), T0 + 10 * S),
    );
    expect(ahead.map((entry) => `${entry.phase.kind} ${entry.phase.round + 1}`)).toEqual([
      'work 1',
      'rest 1',
      'work 2',
      'rest 2',
      'work 3',
    ]);
    expect(ahead[0]).toMatchObject({ startsAt: T0 + 5 * S, endsAt: T0 + 125 * S });
    ahead.slice(1).forEach((entry, index) => expect(entry.startsAt).toBe(ahead[index]?.endsAt));
    expect(ahead.at(-1)?.endsAt).toBe(T0 + (5 + 3 * 120 + 2 * 60) * S);
  });

  test('a rest of 0 is no phase at all', () => {
    const noRest = HEAVY_BAG.map((round) => ({ ...round, restSec: 0 }));
    const ahead = intervalPhasesAhead(startIntervalTimer(noRest, 0, T0));
    expect(ahead.map((entry) => entry.phase.kind)).toEqual(['work', 'work', 'work']);
  });

  test('nothing while paused or over', () => {
    const running = startIntervalTimer(HEAVY_BAG, 5, T0);
    expect(intervalPhasesAhead(pauseIntervalTimer(running, T0 + S))).toEqual([]);
    expect(intervalPhasesAhead(intervalTimerAt(running, T0 + 10_000 * S))).toEqual([]);
  });
});

describe('remaining time', () => {
  test('counts down from the clock, rounds up for display, fills the ring with what is left', () => {
    const timer = startIntervalTimer(HEAVY_BAG, 5, T0);
    expect(intervalPhaseRemainingMs(timer, T0 + 4_800)).toBe(200);
    expect(intervalPhaseRemainingSec(timer, T0 + 4_800)).toBe(1);
    expect(intervalPhaseProgress(timer, T0 + 2_500)).toBe(0.5);
  });

  test('never more than the phase: a clock read just before it began shows it whole', () => {
    const timer = startIntervalTimer(HEAVY_BAG, 0, T0);
    expect(intervalPhaseRemainingMs(timer, T0 - 200)).toBe(120 * S);
    expect(intervalPhaseRemainingSec(timer, T0 - 200)).toBe(120);
  });

  test('an over timer has nothing left', () => {
    const over = endIntervalTimerEarly(startIntervalTimer(HEAVY_BAG, 5, T0), T0);
    expect(intervalPhaseRemainingMs(over, T0)).toBe(0);
    expect(intervalPhaseProgress(over, T0)).toBe(0);
  });
});

describe('pause and resume', () => {
  test('a paused phase does not run out, and resumes with what was left', () => {
    const start = startIntervalTimer(HEAVY_BAG, 0, T0);
    const paused = pauseIntervalTimer(start, T0 + 30 * S);
    expect(isIntervalTimerRunning(paused)).toBe(false);

    const later = intervalTimerAt(paused, T0 + 1_000 * S);
    expect(phaseOf(later)).toBe('work 1');
    expect(intervalPhaseRemainingSec(later, T0 + 1_000 * S)).toBe(90);

    const resumed = resumeIntervalTimer(later, T0 + 1_000 * S);
    expect(resumed.endsAt).toBe(T0 + 1_090 * S);
    expect(phaseOf(intervalTimerAt(resumed, T0 + 1_090 * S))).toBe('rest 1');
  });

  test('pausing catches up first: it holds the phase that is really running', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    const paused = pauseIntervalTimer(start, T0 + (5 + 130) * S);
    expect(phaseOf(paused)).toBe('rest 1');
    expect(paused.remainingMs).toBe(50 * S);
  });

  test('pausing a paused timer and resuming a running one change nothing', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    const paused = pauseIntervalTimer(start, T0 + S);
    expect(pauseIntervalTimer(paused, T0 + 10 * S)).toEqual(paused);
    expect(resumeIntervalTimer(start, T0 + S)).toBe(start);
  });
});

describe('skip rest', () => {
  test('logs the rest taken so far as skipped, then Get ready and the next round', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    const skipAt = T0 + (5 + 120 + 20) * S;
    const skipped = skipIntervalRest(start, skipAt);

    expect(skipped.results[0]).toEqual({
      roundNumber: 1,
      workSec: 120,
      restSec: 20,
      restSkipped: true,
      completed: true,
    });
    expect(phaseOf(skipped)).toBe('getReady 2');
    expect(skipped.endsAt).toBe(skipAt + 5 * S);
    expect(phaseOf(intervalTimerAt(skipped, skipAt + 5 * S))).toBe('work 2');
  });

  test('with a Get ready of 0 the next round starts at once', () => {
    const start = startIntervalTimer(HEAVY_BAG, 0, T0);
    const skipped = skipIntervalRest(start, T0 + 130 * S);
    expect(phaseOf(skipped)).toBe('work 2');
    expect(skipped.endsAt).toBe(T0 + 250 * S);
  });

  test('works from a paused rest too, and runs on after it', () => {
    const start = startIntervalTimer(HEAVY_BAG, 0, T0);
    const paused = pauseIntervalTimer(start, T0 + 135 * S);
    const skipped = skipIntervalRest(paused, T0 + 500 * S);
    expect(skipped.results[0]?.restSec).toBe(15);
    expect(phaseOf(skipped)).toBe('work 2');
    expect(isIntervalTimerRunning(skipped)).toBe(true);
  });

  test('outside a rest it changes nothing', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    expect(skipIntervalRest(start, T0 + S)).toEqual(start);
    expect(skipIntervalRest(start, T0 + 30 * S)).toEqual(intervalTimerAt(start, T0 + 30 * S));
  });
});

describe('end early', () => {
  test('the round being worked is logged with the time it ran and counted as not done', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    const ended = endIntervalTimerEarly(start, T0 + (5 + 120 + 60 + 45.4) * S);
    expect(ended.outcome).toBe('endedEarly');
    expect(ended.phase).toBeUndefined();
    expect(ended.results).toEqual([
      { roundNumber: 1, workSec: 120, restSec: 60, restSkipped: false, completed: true },
      { roundNumber: 2, workSec: 45, restSkipped: false, completed: false },
    ]);
  });

  test('a rest cut short is logged with the time it ran; the rounds after are not logged', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    const ended = endIntervalTimerEarly(start, T0 + (5 + 120 + 25) * S);
    expect(ended.results).toEqual([
      { roundNumber: 1, workSec: 120, restSec: 25, restSkipped: false, completed: true },
    ]);
  });

  test('during Get ready nothing new is logged', () => {
    const start = startIntervalTimer(HEAVY_BAG, 5, T0);
    expect(endIntervalTimerEarly(start, T0 + 2 * S).results).toEqual([]);
  });

  test('a round ended before its first second is not logged — there is no time to log', () => {
    const start = startIntervalTimer(HEAVY_BAG, 0, T0);
    expect(endIntervalTimerEarly(start, T0 + 400).results).toEqual([]);
  });

  test('from a paused round, with the time it ran before the pause', () => {
    const paused = pauseIntervalTimer(startIntervalTimer(HEAVY_BAG, 0, T0), T0 + 70 * S);
    const ended = endIntervalTimerEarly(paused, T0 + 900 * S);
    expect(ended.results).toEqual([
      { roundNumber: 1, workSec: 70, restSkipped: false, completed: false },
    ]);
  });

  test('a timer already over stays as it was', () => {
    const over = intervalTimerAt(startIntervalTimer(HEAVY_BAG, 5, T0), T0 + 10_000 * S);
    expect(endIntervalTimerEarly(over, T0 + 10_001 * S)).toBe(over);
    expect(pauseIntervalTimer(over, T0 + 10_001 * S)).toBe(over);
    expect(resumeIntervalTimer(over, T0 + 10_001 * S)).toBe(over);
  });
});
