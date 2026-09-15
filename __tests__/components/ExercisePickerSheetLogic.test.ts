import { toExerciseId } from '@domain/catalog';
import { confirmButtonLabel, toggleExerciseSelection } from '@components/ExercisePickerSheetLogic';

const BENCH_PRESS = toExerciseId('bench-press');
const SQUAT = toExerciseId('squat');

describe('toggleExerciseSelection', () => {
  test('adds an id that is not yet selected', () => {
    expect(toggleExerciseSelection([], BENCH_PRESS)).toEqual([BENCH_PRESS]);
  });

  test('appends after existing selected ids', () => {
    expect(toggleExerciseSelection([SQUAT], BENCH_PRESS)).toEqual([SQUAT, BENCH_PRESS]);
  });

  test('removes an id that is already selected', () => {
    expect(toggleExerciseSelection([SQUAT, BENCH_PRESS], SQUAT)).toEqual([BENCH_PRESS]);
  });

  test('removing the only selected id leaves an empty selection', () => {
    expect(toggleExerciseSelection([BENCH_PRESS], BENCH_PRESS)).toEqual([]);
  });
});

describe('confirmButtonLabel', () => {
  test('reads "Add 0 exercises" at zero — disabling it is the caller\'s job, not a relabel', () => {
    expect(confirmButtonLabel(0)).toBe('Add 0 exercises');
  });

  test('singular phrasing for exactly one selected', () => {
    expect(confirmButtonLabel(1)).toBe('Add 1 exercise');
  });

  test('plural phrasing for more than one selected', () => {
    expect(confirmButtonLabel(3)).toBe('Add 3 exercises');
  });
});
