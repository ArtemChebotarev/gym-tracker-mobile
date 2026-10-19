import {
  carryRoundTimeForward,
  editRoundTime,
  holdLoggedRound,
  NO_ROUND_TIME_EDITS,
  ROUND_TIME_PICKER,
  roundsWithEdits,
  roundTimePickerSubtitle,
  roundTimePickerTitle,
} from '@components/IntervalRoundRowsLogic';
import type { WorkoutRoundRow } from '@usecases/workoutSession';

const LOGGED: WorkoutRoundRow['log'] = {
  workSec: 110,
  restSec: 50,
  restSkipped: false,
  completed: true,
};

/** Round 1 logged, rounds 2–4 planned at 2:00 / 1:00; round 4 has no rest planned. */
const ROUNDS: WorkoutRoundRow[] = [
  { roundNumber: 1, workSec: 120, restSec: 60, isFirstUnlogged: false, log: LOGGED },
  { roundNumber: 2, workSec: 120, restSec: 60, isFirstUnlogged: true },
  { roundNumber: 3, workSec: 120, restSec: 60, isFirstUnlogged: false },
  { roundNumber: 4, workSec: 120, isFirstUnlogged: false },
];

describe('round times (GT-90)', () => {
  test('DoD: a picked rest fills the unlogged rounds below once the picker closes', () => {
    const picked = editRoundTime(NO_ROUND_TIME_EDITS, 'rest', 2, 45);
    const carried = carryRoundTimeForward(picked, 'rest', ROUNDS, 2);

    expect(roundsWithEdits(ROUNDS, carried).map((round) => round.restSec)).toEqual([
      60, // round 1 is logged: it reads as logged, its plan untouched
      45,
      45,
      undefined, // no rest planned, nothing to fill
    ]);
  });

  test('DoD: a picked work time carries too, and logged rounds never change', () => {
    const carried = carryRoundTimeForward(
      editRoundTime(NO_ROUND_TIME_EDITS, 'work', 2, 90),
      'work',
      ROUNDS,
      2,
    );

    expect(roundsWithEdits(ROUNDS, carried).map((round) => round.workSec)).toEqual([
      120, 90, 90, 90,
    ]);
    expect(roundsWithEdits(ROUNDS, carried)[0]).toBe(ROUNDS[0]);
  });

  test('a round set by hand is not overwritten by a later change above it', () => {
    let edits = editRoundTime(NO_ROUND_TIME_EDITS, 'rest', 3, 30);
    edits = carryRoundTimeForward(editRoundTime(edits, 'rest', 2, 45), 'rest', ROUNDS, 2);

    expect(roundsWithEdits(ROUNDS, edits).map((round) => round.restSec)).toEqual([
      60,
      45,
      30,
      undefined,
    ]);
  });

  test('un-logging a round brings its logged times back as its own', () => {
    const held = holdLoggedRound(NO_ROUND_TIME_EDITS, ROUNDS[0]!);
    const reopened = { ...ROUNDS[0]!, isFirstUnlogged: true };
    const { log: _log, ...unlogged } = reopened;

    expect(roundsWithEdits([unlogged], held)[0]).toMatchObject({ workSec: 110, restSec: 50 });
    expect(held.work[1]?.isManual).toBe(true);
    expect(holdLoggedRound(NO_ROUND_TIME_EDITS, ROUNDS[1]!)).toBe(NO_ROUND_TIME_EDITS);
  });

  test('the picker says what it sets, and that rounds below follow while one is open', () => {
    expect(roundTimePickerTitle('rest', 1)).toBe('Rest · round 1');
    expect(roundTimePickerTitle('work', 3)).toBe('Work · round 3');
    expect(roundTimePickerSubtitle(ROUNDS, 2)).toBe('Rounds below follow until you log them');
    expect(roundTimePickerSubtitle(ROUNDS, 4)).toBeUndefined();
  });

  test('the picker keeps the exercise config’s bounds, in 5 s steps', () => {
    expect(ROUND_TIME_PICKER.work).toEqual({ minSec: 5, maxSec: 3600, stepSec: 5 });
    expect(ROUND_TIME_PICKER.rest).toEqual({ minSec: 0, maxSec: 600, stepSec: 5 });
  });
});
