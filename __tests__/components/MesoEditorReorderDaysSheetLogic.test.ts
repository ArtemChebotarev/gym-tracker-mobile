import { toExerciseId, type Exercise } from '@domain/catalog';
import {
  applyDayDrag,
  reorderDaySummary,
} from '@components/MesoEditorReorderDaysSheetLogic';
import { STAMPS } from '../fixtures/stamps';

const exercise = (id: string, name: string): Exercise => ({
  ...STAMPS,
  id: toExerciseId(id),
  name,
  muscleGroup: 'chest',
  source: 'catalog',
  isHidden: false,
});

const BY_ID = { bench: exercise('bench', 'Bench Press'), row: exercise('row', 'Row') };

describe('reorderDaySummary (GT-270)', () => {
  test("lists the day's exercises in their order", () => {
    expect(
      reorderDaySummary(
        [
          { exerciseId: 'row', order: 0, sets: 3 },
          { exerciseId: 'bench', order: 1, sets: 3 },
        ],
        BY_ID,
      ),
    ).toBe('Row, Bench Press');
  });

  test('says so for a day with nothing in it yet', () => {
    expect(reorderDaySummary([], BY_ID)).toBe('No exercises yet');
  });
});

describe('applyDayDrag (GT-270)', () => {
  test('a drag moves the day it picked up, by position in the list', () => {
    // The list already reads 3, 1, 2; the drag takes its first row to the end.
    expect(applyDayDrag([3, 1, 2], [1, 2, 0])).toEqual([1, 2, 3]);
  });
});
