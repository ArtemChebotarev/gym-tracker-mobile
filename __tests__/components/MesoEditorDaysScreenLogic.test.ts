import { toExerciseId } from '@domain/catalog';
import type { Exercise } from '@domain/catalog';
import { DEFAULT_EXERCISE_SETS } from '@domain/planValidators';
import {
  addExerciseToDay,
  canContinueFromDays,
  exerciseDotColor,
  exerciseSubtitle,
  exerciseTitle,
  formatDayExerciseCount,
  getDayExercises,
  getDayNumbers,
  removeExerciseFromDay,
  updateExerciseSets,
  type ExercisesByDay,
} from '@components/MesoEditorDaysScreenLogic';

const BENCH_PRESS: Exercise = {
  id: toExerciseId('bench-press'),
  name: 'Bench Press',
  muscleGroup: 'chest',
  source: 'catalog',
  isHidden: false,
};

const SQUAT: Exercise = {
  id: toExerciseId('squat'),
  name: 'Squat',
  muscleGroup: 'quads',
  source: 'catalog',
  isHidden: false,
};

describe('getDayNumbers', () => {
  test('returns 1..daysPerWeek', () => {
    expect(getDayNumbers(4)).toEqual([1, 2, 3, 4]);
    expect(getDayNumbers(1)).toEqual([1]);
  });
});

describe('getDayExercises', () => {
  test('reads an untouched day as empty', () => {
    expect(getDayExercises({}, 1)).toEqual([]);
  });

  test('reads the stored exercises for a day that has them', () => {
    const exercisesByDay: ExercisesByDay = { 1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }] };

    expect(getDayExercises(exercisesByDay, 1)).toEqual([
      { exerciseId: 'bench-press', order: 0, sets: 3 },
    ]);
  });
});

describe('addExerciseToDay', () => {
  test('adds the exercise with the default sets and does not touch other days', () => {
    const result = addExerciseToDay({}, 1, 'bench-press');

    expect(result[1]).toEqual([{ exerciseId: 'bench-press', order: 0, sets: DEFAULT_EXERCISE_SETS }]);
  });

  test('appends after existing exercises on the day with the next order', () => {
    const existing: ExercisesByDay = { 1: [{ exerciseId: 'squat', order: 0, sets: 2 }] };

    const result = addExerciseToDay(existing, 1, 'bench-press');

    expect(result[1]).toEqual([
      { exerciseId: 'squat', order: 0, sets: 2 },
      { exerciseId: 'bench-press', order: 1, sets: DEFAULT_EXERCISE_SETS },
    ]);
  });
});

describe('removeExerciseFromDay', () => {
  test('removes the exercise at the given index and reindexes the rest', () => {
    const existing: ExercisesByDay = {
      1: [
        { exerciseId: 'squat', order: 0, sets: 2 },
        { exerciseId: 'bench-press', order: 1, sets: 2 },
      ],
    };

    const result = removeExerciseFromDay(existing, 1, 0);

    expect(result[1]).toEqual([{ exerciseId: 'bench-press', order: 0, sets: 2 }]);
  });
});

describe('updateExerciseSets', () => {
  test('changes only the targeted exercise', () => {
    const existing: ExercisesByDay = {
      1: [
        { exerciseId: 'squat', order: 0, sets: 2 },
        { exerciseId: 'bench-press', order: 1, sets: 2 },
      ],
    };

    const result = updateExerciseSets(existing, 1, 1, 4);

    expect(result[1]).toEqual([
      { exerciseId: 'squat', order: 0, sets: 2 },
      { exerciseId: 'bench-press', order: 1, sets: 4 },
    ]);
  });
});

describe('canContinueFromDays', () => {
  test('rejects when any day 1..daysPerWeek is empty', () => {
    const exercisesByDay: ExercisesByDay = { 1: [{ exerciseId: 'squat', order: 0, sets: 2 }] };

    expect(canContinueFromDays(2, exercisesByDay)).toBe(false);
  });

  test('accepts when every day has at least one exercise', () => {
    const exercisesByDay: ExercisesByDay = {
      1: [{ exerciseId: 'squat', order: 0, sets: 2 }],
      2: [{ exerciseId: 'bench-press', order: 0, sets: 2 }],
    };

    expect(canContinueFromDays(2, exercisesByDay)).toBe(true);
  });

  test('is vacuously true for daysPerWeek 0 — never a real draft value (min is 1), but documents the edge case', () => {
    expect(canContinueFromDays(0, {})).toBe(true);
  });
});

describe('formatDayExerciseCount', () => {
  test('pluralizes for anything other than exactly 1', () => {
    expect(formatDayExerciseCount(0)).toBe('0 exercises');
    expect(formatDayExerciseCount(1)).toBe('1 exercise');
    expect(formatDayExerciseCount(4)).toBe('4 exercises');
  });
});

describe('exercise display helpers', () => {
  const exercisesById = { [BENCH_PRESS.id]: BENCH_PRESS, [SQUAT.id]: SQUAT };

  test('exerciseTitle returns the name, empty string when unresolved', () => {
    expect(exerciseTitle(exercisesById, BENCH_PRESS.id)).toBe('Bench Press');
    expect(exerciseTitle(exercisesById, 'missing')).toBe('');
  });

  test('exerciseSubtitle returns the muscle group label, empty string when unresolved', () => {
    expect(exerciseSubtitle(exercisesById, SQUAT.id)).toBe('Quads');
    expect(exerciseSubtitle(exercisesById, 'missing')).toBe('');
  });

  test('exerciseDotColor returns the category color, undefined when unresolved', () => {
    expect(exerciseDotColor(exercisesById, BENCH_PRESS.id)).toBeDefined();
    expect(exerciseDotColor(exercisesById, 'missing')).toBeUndefined();
  });
});
