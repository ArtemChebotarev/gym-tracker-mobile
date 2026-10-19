import {
  intervalProgressionPlate,
  progressionInfoLabel,
  startTimerLabel,
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
  test('with nothing logged it says how long the block takes: work plus the rests between', () => {
    // The last round's rest is before the next exercise, not part of the block.
    expect(startTimerLabel(ROUNDS)).toBe('Start timer · 7:30');
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
  test('the rest lever: the step, what a missed round does, and this week’s rest', () => {
    const plate = intervalProgressionPlate({ column: 'rest', stepSec: 15 }, ROUNDS);

    expect(plate.title).toBe('Less rest each week');
    expect(plate.rows.map((row) => row.text)).toEqual([
      ['Finish every round: ', 'rest', ' gets ', { strong: '15 s shorter' }, ' next week.'],
      ['Miss a round: the plan ', { strong: 'repeats' }, '.'],
      ['This week ', { strong: '0:45' }, '.'],
    ]);
  });

  test('the work lever speaks of the work, and its time', () => {
    const plate = intervalProgressionPlate({ column: 'work', stepSec: 5 }, ROUNDS);

    expect(plate.title).toBe('More work each week');
    expect(plate.rows[0]?.text).toContainEqual({ strong: '5 s longer' });
    expect(plate.rows[2]?.text).toContainEqual({ strong: '2:00' });
  });

  test('a round with no rest planned has no rest to show for this week', () => {
    const { restSec: _restSec, ...noRest } = ROUNDS[2]!;
    const plate = intervalProgressionPlate({ column: 'rest', stepSec: 10 }, [noRest]);

    expect(plate.rows).toHaveLength(2);
  });
});

describe('progressionInfoLabel', () => {
  test('names the column the ⓘ explains', () => {
    expect(progressionInfoLabel({ column: 'rest', stepSec: 15 })).toBe('How rest progresses');
    expect(progressionInfoLabel({ column: 'work', stepSec: 15 })).toBe('How work progresses');
  });
});
