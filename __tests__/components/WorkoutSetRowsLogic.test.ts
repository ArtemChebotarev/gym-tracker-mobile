import {
  type WeightEdits,
  carryWeightForward,
  editWeightText,
  holdLoggedWeight,
  weightFieldText,
} from '@components/WorkoutSetRowsLogic';
import type { WorkoutSetRow } from '@usecases/workoutSession';

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
    test("an untouched field shows the set's suggested weight", () => {
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

    test("a carried value is not the user's own — a later edit replaces it", () => {
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
