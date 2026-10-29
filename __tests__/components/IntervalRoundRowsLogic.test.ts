import {
  carryRoundTimeForward,
  editRoundTime,
  followRoundChanges,
  holdLoggedRound,
  NO_ROUND_TIME_EDITS,
  pickerStartSec,
  ROUND_TIME_PICKER,
  roundsWithEdits,
  roundTimePickerSubtitle,
  roundTimePickerTitle,
  roundTimeToSave,
  shownRestSec,
} from '@components/IntervalRoundRowsLogic';
import type { WorkoutRoundRow } from '@usecases/workoutSession';

const LOGGED: WorkoutRoundRow['log'] = {
  workSec: 110,
  restSec: 50,
  restSkipped: false,
  completed: true,
};

/** Round 1 logged, rounds 2–4 planned at 2:00 / 1:00; round 4 has no rest yet (GT-187). */
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
      45, // an empty rest is filled too (GT-187)
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
      45, // an empty rest follows the pick past the hand-set round (GT-187)
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

  test('the picker keeps the exercise config’s bounds, in 5 s steps — a rest of 10 s at least', () => {
    expect(ROUND_TIME_PICKER.work).toEqual({ minSec: 5, maxSec: 3600, stepSec: 5 });
    expect(ROUND_TIME_PICKER.rest).toEqual({ minSec: 10, maxSec: 600, stepSec: 5 });
  });
});

describe('rounds added and removed from the menu (GT-91)', () => {
  const unlogged: WorkoutRoundRow[] = ROUNDS.slice(1, 3).map((round, index) => ({
    ...round,
    roundNumber: index + 1,
  }));
  const withThird: WorkoutRoundRow[] = [
    ...unlogged,
    { roundNumber: 3, workSec: 120, restSec: 60, isFirstUnlogged: false },
  ];

  test('a new round takes what the last one’s fields hold — picked or carried', () => {
    const picked = carryRoundTimeForward(
      editRoundTime(editRoundTime(NO_ROUND_TIME_EDITS, 'work', 2, 135), 'rest', 1, 45),
      'rest',
      unlogged,
      1,
    );

    const followed = followRoundChanges(picked, unlogged, withThird);

    expect(roundsWithEdits(withThird, followed)[2]).toMatchObject({ workSec: 135, restSec: 45 });
    // Carried, not the user's own: picking again above still reaches it.
    expect(followed.work[3]).toEqual({ sec: 135, isManual: false });
  });

  test('nothing picked, the new round keeps its plan', () => {
    expect(followRoundChanges(NO_ROUND_TIME_EDITS, unlogged, withThird)).toEqual(
      NO_ROUND_TIME_EDITS,
    );
  });

  test('a logged last round passes nothing on — the stored round copies its log', () => {
    const lastLogged = [unlogged[0]!, { ...unlogged[1]!, log: LOGGED }];
    const edits = editRoundTime(NO_ROUND_TIME_EDITS, 'work', 2, 135);

    expect(followRoundChanges(edits, lastLogged, [...lastLogged, withThird[2]!]).work[3]).toBe(
      undefined,
    );
  });

  test('a removed round’s times go with it, so one added back starts from the plan', () => {
    const edits = editRoundTime(NO_ROUND_TIME_EDITS, 'work', 3, 150);

    const removed = followRoundChanges(edits, withThird, unlogged);
    expect(removed).toEqual(NO_ROUND_TIME_EDITS);
    expect(followRoundChanges(removed, unlogged, withThird)).toEqual(NO_ROUND_TIME_EDITS);
  });

  test('the same rounds again leave the edits as they are', () => {
    const edits = editRoundTime(NO_ROUND_TIME_EDITS, 'work', 1, 135);

    expect(followRoundChanges(edits, unlogged, [...unlogged])).toBe(edits);
  });
});

describe('shownRestSec (Artem, 20.10.2026)', () => {
  const planned = ROUNDS[1]!;

  test('an unlogged round shows its planned rest', () => {
    expect(shownRestSec(planned)).toBe(60);
  });

  test('a logged round shows the rest it took — a rest cut short too', () => {
    expect(shownRestSec({ ...planned, log: { ...LOGGED!, restSec: 25 } })).toBe(25);
  });

  test('a skipped rest, or a round logged without one, shows the planned rest', () => {
    expect(shownRestSec({ ...planned, log: { ...LOGGED!, restSec: 10, restSkipped: true } })).toBe(
      60,
    );
    const { restSec: _restSec, ...noRest } = LOGGED!;
    expect(shownRestSec({ ...planned, log: noRest })).toBe(60);
  });

  test('un-logging a round whose rest was skipped brings back the planned rest, not the cut one', () => {
    const skipped = { ...planned, log: { ...LOGGED!, restSec: 10, restSkipped: true } };
    const held = holdLoggedRound(NO_ROUND_TIME_EDITS, skipped);
    expect(roundsWithEdits([{ ...skipped, log: undefined }], held)[0]).toMatchObject({
      workSec: 110,
      restSec: 60,
    });
  });
});

describe('rounds with no time yet (GT-187)', () => {
  const EMPTY: WorkoutRoundRow[] = [
    { roundNumber: 1, isFirstUnlogged: true },
    { roundNumber: 2, isFirstUnlogged: false },
    { roundNumber: 3, isFirstUnlogged: false },
  ];

  test('DoD: the first pick fills the empty rounds below, Work and Rest alike', () => {
    let edits = carryRoundTimeForward(
      editRoundTime(NO_ROUND_TIME_EDITS, 'work', 1, 30),
      'work',
      EMPTY,
      1,
    );
    edits = carryRoundTimeForward(editRoundTime(edits, 'rest', 1, 60), 'rest', EMPTY, 1);

    expect(roundsWithEdits(EMPTY, edits).map(({ workSec, restSec }) => [workSec, restSec])).toEqual(
      [
        [30, 60],
        [30, 60],
        [30, 60],
      ],
    );
  });

  test('an empty field’s wheels start from the nearest time above, else the least time', () => {
    const filled: WorkoutRoundRow[] = [
      { ...EMPTY[0]!, workSec: 45, restSec: 20 },
      ...EMPTY.slice(1),
    ];

    expect(pickerStartSec(filled, 'work', 3)).toBe(45);
    expect(pickerStartSec(filled, 'rest', 2)).toBe(20);
    expect(pickerStartSec(EMPTY, 'work', 2)).toBe(ROUND_TIME_PICKER.work.minSec);
    expect(pickerStartSec(EMPTY, 'rest', 1)).toBe(10);
    // A field with a time starts from it.
    expect(pickerStartSec(ROUNDS, 'rest', 1)).toBe(50);
  });

  test('what a closed picker saves: the round picked and every round the carry-over changed', () => {
    const picked = editRoundTime(editRoundTime(NO_ROUND_TIME_EDITS, 'rest', 3, 30), 'rest', 2, 45);
    const carried = carryRoundTimeForward(picked, 'rest', ROUNDS, 2);

    // Round 3 was picked by hand and keeps its own time; round 4 followed.
    expect(roundTimeToSave(picked, carried, 'rest', 2)).toEqual({ sec: 45, roundNumbers: [2, 4] });
  });

  test('nothing picked on the round, nothing to save', () => {
    expect(roundTimeToSave(NO_ROUND_TIME_EDITS, NO_ROUND_TIME_EDITS, 'work', 2)).toBeUndefined();
  });
});
