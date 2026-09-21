import {
  type WeightEdits,
  carryWeightForward,
  editWeightText,
  exerciseCardView,
  formatWeightHint,
  holdLoggedWeight,
  showsGroupChip,
  weightFieldText,
} from '@components/WorkoutExerciseCardLogic';
import type { WorkoutSetRow } from '@usecases/workoutSession';

const ROW: WorkoutSetRow = { setNumber: 1, isFirstUnlogged: false, log: { weight: 60, reps: 10 } };
const SKIPPED_ROW: WorkoutSetRow = { setNumber: 2, isFirstUnlogged: false, isSkipped: true };

describe('exerciseCardView', () => {
  test('live: the menu and the RIR badge, set rows, no plate', () => {
    expect(exerciseCardView('live', { status: 'planned', targetRir: 2, rows: [ROW] })).toEqual({
      showMenu: true,
      rirLabel: '2 RIR',
      isSkipped: false,
      showSets: true,
      showSkippedNote: false,
      showNotProgrammed: false,
    });
  });

  test('read-only: no menu, everything else like live', () => {
    expect(
      exerciseCardView('readonly', { status: 'completed', targetRir: 2, rows: [ROW] }),
    ).toEqual({
      showMenu: false,
      rirLabel: '2 RIR',
      isSkipped: false,
      showSets: true,
      showSkippedNote: false,
      showNotProgrammed: false,
    });
  });

  test('a skipped exercise with sets logged is dimmed but keeps its rows, menu in live only', () => {
    expect(
      exerciseCardView('live', { status: 'skipped', targetRir: 2, rows: [ROW, SKIPPED_ROW] }),
    ).toMatchObject({
      showMenu: true,
      isSkipped: true,
      showSets: true,
    });
    expect(
      exerciseCardView('readonly', { status: 'skipped', targetRir: 2, rows: [ROW, SKIPPED_ROW] }),
    ).toMatchObject({
      showMenu: false,
      isSkipped: true,
      showSets: true,
    });
  });

  test('a skipped exercise with nothing logged collapses its rows into one Skipped note', () => {
    expect(
      exerciseCardView('readonly', {
        status: 'skipped',
        targetRir: 2,
        rows: [{ ...SKIPPED_ROW, setNumber: 1 }, SKIPPED_ROW],
      }),
    ).toMatchObject({ isSkipped: true, showSets: false, showSkippedNote: true });
  });

  test('preview: the plate only — no menu, no RIR badge, no set rows', () => {
    expect(exerciseCardView('preview', { status: 'planned', targetRir: 2, rows: [ROW] })).toEqual({
      showMenu: false,
      rirLabel: undefined,
      isSkipped: false,
      showSets: false,
      showSkippedNote: false,
      showNotProgrammed: true,
    });
  });

  test('no RIR badge without a target RIR', () => {
    expect(exerciseCardView('live', { status: 'planned', rows: [ROW] }).rirLabel).toBeUndefined();
  });
});

describe('showsGroupChip', () => {
  const exercises = [
    { muscleGroup: 'chest' },
    { muscleGroup: 'chest' },
    { muscleGroup: 'back' },
    { muscleGroup: 'chest' },
  ] as const;

  test('the first card always gets the chip', () => {
    expect(showsGroupChip(exercises, 0)).toBe(true);
  });

  test('no chip when the group is the same as the previous card', () => {
    expect(showsGroupChip(exercises, 1)).toBe(false);
  });

  test('a chip when the group changes from the previous card', () => {
    expect(showsGroupChip(exercises, 2)).toBe(true);
  });

  test('a group coming back after another one gets the chip again', () => {
    expect(showsGroupChip(exercises, 3)).toBe(true);
  });

  test('groups sharing a color family still count as different (traps after back)', () => {
    expect(showsGroupChip([{ muscleGroup: 'back' }, { muscleGroup: 'traps' }], 1)).toBe(true);
  });

  test('an index past the list gets no chip', () => {
    expect(showsGroupChip(exercises, 4)).toBe(false);
  });
});

describe('formatWeightHint', () => {
  test('go heavier names the upper bound reached', () => {
    expect(formatWeightHint({ direction: 'increase', reps: 30 })).toBe(
      'Go heavier — 30+ reps last week',
    );
  });

  test('go lighter names the lower bound missed', () => {
    expect(formatWeightHint({ direction: 'decrease', reps: 5 })).toBe(
      'Go lighter — under 5 reps last week',
    );
  });
});

describe('the Weight fields of one exercise (task 106)', () => {
  /** Three sets suggested at 60 kg, none logged — the shape the carry-over rules are written for. */
  function sets(...overrides: Partial<WorkoutSetRow>[]): WorkoutSetRow[] {
    return [1, 2, 3].map((setNumber) => ({
      setNumber,
      suggestedWeight: 60,
      isFirstUnlogged: setNumber === 1,
      ...overrides[setNumber - 1],
    }));
  }

  /** What each set's field shows, as the card reads it out. */
  function texts(edits: WeightEdits, rows: WorkoutSetRow[]): string[] {
    return rows.map((row) => weightFieldText(edits, row));
  }

  describe('weightFieldText', () => {
    test('an untouched field shows the set\'s suggested weight', () => {
      expect(weightFieldText({}, { setNumber: 1, suggestedWeight: 62.5 })).toBe('62.5');
    });

    test('empty when the set has no suggested weight', () => {
      expect(weightFieldText({}, { setNumber: 1 })).toBe('');
    });

    test('an edit wins over the suggested weight — including an emptied field', () => {
      const edits = editWeightText({}, 1, '');
      expect(weightFieldText(edits, { setNumber: 1, suggestedWeight: 62.5 })).toBe('');
    });
  });

  describe('carryWeightForward', () => {
    test("DoD: the first set's weight fills the whole exercise", () => {
      const rows = sets();
      const edits = carryWeightForward(editWeightText({}, 1, '20'), rows, 1);

      expect(texts(edits, rows)).toEqual(['20', '20', '20']);
    });

    test('DoD: a logged set is never touched, and only later sets follow', () => {
      // Artem's example: set 1 logged at 20, set 2 corrected to 25 — set 3 follows, set 1 doesn't.
      const rows = sets({ log: { weight: 20, reps: 10 } });
      const edits = carryWeightForward(editWeightText({}, 2, '25'), rows, 2);

      expect(texts(edits, rows)).toEqual(['60', '25', '25']);
      expect(rows[0]?.log).toEqual({ weight: 20, reps: 10 });
    });

    test('DoD: a field the user typed in themselves is left alone', () => {
      const rows = sets();
      let edits = carryWeightForward(editWeightText({}, 3, '30'), rows, 3);
      edits = carryWeightForward(editWeightText(edits, 1, '20'), rows, 1);

      expect(texts(edits, rows)).toEqual(['20', '20', '30']);
    });

    test('a carried value is not the user\'s own — a later edit replaces it', () => {
      const rows = sets();
      let edits = carryWeightForward(editWeightText({}, 1, '20'), rows, 1);
      edits = carryWeightForward(editWeightText(edits, 2, '25'), rows, 2);

      expect(texts(edits, rows)).toEqual(['20', '25', '25']);
    });

    test('leaving a field nobody typed in carries nothing', () => {
      const rows = sets({}, { suggestedWeight: undefined });

      expect(carryWeightForward({}, rows, 1)).toEqual({});
    });

    test('the last set has nothing to carry into', () => {
      const rows = sets();
      const typed = editWeightText({}, 3, '30');

      expect(carryWeightForward(typed, rows, 3)).toEqual(typed);
    });

    test('a set number that is not in the rows changes nothing', () => {
      const typed = editWeightText({}, 9, '30');

      expect(carryWeightForward(typed, sets(), 9)).toEqual(typed);
    });

    test('an emptied field carries the empty value forward too', () => {
      const rows = sets();
      const edits = carryWeightForward(editWeightText({}, 1, ''), rows, 1);

      expect(texts(edits, rows)).toEqual(['', '', '']);
    });
  });

  describe('holdLoggedWeight', () => {
    test("un-logging puts the logged weight back, as the user's own value", () => {
      const rows = sets();
      let edits = carryWeightForward(editWeightText({}, 1, '20'), rows, 1);
      edits = holdLoggedWeight(edits, 2, 25);
      edits = carryWeightForward(editWeightText(edits, 1, '22'), rows, 1);

      expect(texts(edits, rows)).toEqual(['22', '25', '22']);
    });
  });
});
