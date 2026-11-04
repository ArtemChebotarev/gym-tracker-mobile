import {
  hasRoundTimes,
  intervalInfo,
  intervalProgressionPlate,
  lacksRoundTimes,
  progressionInfoLabel,
  roundEntryOf,
  startTimerLabel,
  timerRoundsOf,
} from '@components/IntervalExerciseCardLogic';
import type { WorkoutRoundRow } from '@usecases/workoutSession';

/** 3 × 2:00 with 0:45 after each — the canvas's Heavy bag (1.6), with the last round's rest. */
const ROUNDS: WorkoutRoundRow[] = [
  { roundNumber: 1, workSec: 120, restSec: 45, isFirstUnlogged: true },
  { roundNumber: 2, workSec: 120, restSec: 45, isFirstUnlogged: false },
  { roundNumber: 3, workSec: 120, restSec: 45, isFirstUnlogged: false },
];

const LOGGED: WorkoutRoundRow['log'] = {
  workSec: 120,
  restSec: 45,
  restSkipped: false,
  completed: true,
};

describe('startTimerLabel', () => {
  test('with nothing logged, how many rounds the block has', () => {
    expect(startTimerLabel(ROUNDS)).toBe('Start timer · 3 rounds');
    expect(startTimerLabel(ROUNDS.slice(0, 1))).toBe('Start timer · 1 round');
  });

  test('once a round is logged by hand, how many are left', () => {
    const [first, ...rest] = ROUNDS;
    expect(startTimerLabel([{ ...first!, log: LOGGED }, ...rest])).toBe(
      'Start timer · 2 rounds left',
    );
    expect(
      startTimerLabel([{ ...first!, log: LOGGED }, { ...rest[0]!, log: LOGGED }, rest[1]!]),
    ).toBe('Start timer · 1 round left');
  });

  test('nothing left to time, no button', () => {
    expect(startTimerLabel(ROUNDS.map((round) => ({ ...round, log: LOGGED })))).toBeUndefined();
    expect(startTimerLabel([])).toBeUndefined();
  });
});

describe('intervalProgressionPlate', () => {
  test('the rest lever: the step, and nothing else', () => {
    const plate = intervalProgressionPlate({ column: 'rest', stepSec: 15 });

    expect(plate.title).toBe('Less rest each week');
    expect(plate.rows.map((row) => row.text)).toEqual([
      ['Finish every round: ', 'rest', ' gets ', { strong: '15 s shorter' }, ' next week.'],
    ]);
  });

  test('the work lever speaks of the work', () => {
    const plate = intervalProgressionPlate({ column: 'work', stepSec: 5 });

    expect(plate.title).toBe('More work each week');
    expect(plate.rows.map((row) => row.text)).toEqual([
      ['Finish every round: ', 'work', ' gets ', { strong: '5 s longer' }, ' next week.'],
    ]);
  });
});

// 08.11, "Intervals: Work ⓘ".
describe('intervalInfo', () => {
  const timed: WorkoutRoundRow[] = [{ roundNumber: 1, workSec: 60, restSec: 30, isFirstUnlogged: true }];
  const untimed: WorkoutRoundRow[] = [{ roundNumber: 1, isFirstUnlogged: true }];
  const rest = { column: 'rest', stepSec: 5 } as const;
  const work = { column: 'work', stepSec: 10 } as const;

  test('a round with no time says how to pick one, with the step of the lever', () => {
    expect(intervalInfo(untimed, rest, 'live', false)).toEqual({
      kind: 'finding-time',
      progressionLine: ['Finish every round: ', 'rest', ' gets ', { strong: '5 s shorter' }, ' next week.'],
    });
    expect(intervalInfo(untimed, work, 'live', false)).toEqual({
      kind: 'finding-time',
      progressionLine: ['Finish every round: ', 'work', ' gets ', { strong: '10 s longer' }, ' next week.'],
    });
  });

  test('on rounds or none, the same plate with no line about a step', () => {
    expect(intervalInfo(untimed, undefined, 'live', false)).toEqual({ kind: 'finding-time' });
  });

  test('only one time of the two is still no time', () => {
    const noRest: WorkoutRoundRow[] = [{ roundNumber: 1, workSec: 60, isFirstUnlogged: true }];
    expect(intervalInfo(noRest, rest, 'live', false)?.kind).toBe('finding-time');
  });

  test('with times, the step and its label', () => {
    expect(intervalInfo(timed, rest, 'live', false)).toMatchObject({
      kind: 'progression',
      plate: { title: 'Less rest each week' },
      accessibilityLabel: 'How rest progresses',
    });
  });

  test('with times on rounds or none there is nothing to say, so no ⓘ', () => {
    expect(intervalInfo(timed, undefined, 'live', false)).toBeUndefined();
  });

  test('no ⓘ on a deload or outside a live workout, even with no time', () => {
    expect(intervalInfo(untimed, rest, 'live', true)).toBeUndefined();
    expect(intervalInfo(untimed, rest, 'readonly', false)).toBeUndefined();
    expect(intervalInfo(timed, rest, 'readonly', false)).toBeUndefined();
  });
});

describe('roundEntryOf', () => {
  test('one tap logs the times the fields hold', () => {
    expect(roundEntryOf(ROUNDS[0]!)).toEqual({ workSec: 120, restSec: 45 });
  });

  test('nothing to log while a field is empty (GT-187)', () => {
    const { restSec: _restSec, ...noRest } = ROUNDS[2]!;
    const { workSec: _workSec, ...noWork } = ROUNDS[2]!;
    expect(roundEntryOf(noRest)).toBeUndefined();
    expect(roundEntryOf(noWork)).toBeUndefined();
  });
});

describe('progressionInfoLabel', () => {
  test('names the column the ⓘ explains', () => {
    expect(progressionInfoLabel({ column: 'rest', stepSec: 15 })).toBe('How rest progresses');
    expect(progressionInfoLabel({ column: 'work', stepSec: 15 })).toBe('How work progresses');
  });
});

describe('timerRoundsOf', () => {
  test('the rounds not yet logged, from the first, with the times their fields show', () => {
    const rounds: WorkoutRoundRow[] = [
      { ...ROUNDS[0]!, log: LOGGED },
      { ...ROUNDS[1]!, workSec: 90 },
      { ...ROUNDS[2]!, restSec: 30 },
    ];
    expect(timerRoundsOf(rounds)).toEqual([
      { roundNumber: 2, workSec: 90, restSec: 45 },
      { roundNumber: 3, workSec: 120, restSec: 30 },
    ]);
  });

  test('no timer while a round still to do has an empty field (GT-187)', () => {
    const { restSec: _restSec, ...noRest } = ROUNDS[2]!;
    expect(timerRoundsOf([ROUNDS[0]!, ROUNDS[1]!, noRest])).toBeUndefined();
    // A logged round's empty plan doesn't matter: it isn't timed.
    const { workSec: _workSec, ...noWork } = ROUNDS[0]!;
    expect(timerRoundsOf([{ ...noWork, log: LOGGED }, ROUNDS[1]!])).toHaveLength(1);
  });

  test('nothing once every round is logged', () => {
    expect(timerRoundsOf(ROUNDS.map((round) => ({ ...round, log: LOGGED })))).toEqual([]);
  });
});

describe('rounds with no time yet (GT-187)', () => {
  test('a round has its times once both work and rest are set', () => {
    const { restSec: _restSec, ...noRest } = ROUNDS[0]!;
    expect(hasRoundTimes(ROUNDS[0]!)).toBe(true);
    expect(hasRoundTimes(noRest)).toBe(false);
  });

  test('the hint shows while a round still to do lacks a time — not for a logged or skipped one', () => {
    const empty: WorkoutRoundRow = { roundNumber: 3, isFirstUnlogged: false };
    expect(lacksRoundTimes(ROUNDS)).toBe(false);
    expect(lacksRoundTimes([ROUNDS[0]!, empty])).toBe(true);
    expect(lacksRoundTimes([{ ...empty, log: LOGGED }])).toBe(false);
    expect(lacksRoundTimes([{ ...empty, notDone: 'skipped' }])).toBe(false);
  });
});
