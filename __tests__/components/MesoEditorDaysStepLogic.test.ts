import { toExerciseId } from '@domain/catalog';
import type { Exercise } from '@domain/catalog';
import { DEFAULT_EXERCISE_SETS } from '@domain/planValidators';
import {
  addExerciseToDay,
  canContinueFromDays,
  exerciseDotColor,
  exerciseSubtitle,
  exerciseTitle,
  exerciseTypeIcon,
  formatRoundCount,
  hasSetsStepper,
  formatSetCount,
  getDayExercises,
  getDayNumbers,
  removeExerciseFromDay,
  reorderDayExercises,
  reorderDays,
  invertDayOrder,
  movesAnyDay,
  stepperNoun,
  updateExerciseSets,
  type ExercisesByDay,
} from '@components/MesoEditorDaysStepLogic';
import { moveIndex } from '@components/dragReorderLogic';
import { COOLDOWN, HEAVY_BAG, MEDBALL_THROW } from '../fixtures/hybridExercises';
import { STAMPS } from '../fixtures/stamps';

const BENCH_PRESS: Exercise = {
  ...STAMPS,
  id: toExerciseId('bench-press'),
  name: 'Bench Press',
  muscleGroup: 'chest',
  source: 'catalog',
  isHidden: false,
};

const SQUAT: Exercise = {
  ...STAMPS,
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
    const exercisesByDay: ExercisesByDay = {
      1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }],
    };

    expect(getDayExercises(exercisesByDay, 1)).toEqual([
      { exerciseId: 'bench-press', order: 0, sets: 3 },
    ]);
  });
});

describe('addExerciseToDay', () => {
  test('adds the exercise with the default sets and does not touch other days', () => {
    const result = addExerciseToDay({}, 1, 'bench-press');

    expect(result[1]).toEqual([
      { exerciseId: 'bench-press', order: 0, sets: DEFAULT_EXERCISE_SETS },
    ]);
  });

  // GT-148: a copied day arrives numbered from 1, so `existing.length` would repeat its last one.
  test('takes the order after the highest one, not the count', () => {
    const copied: ExercisesByDay = { 1: [{ exerciseId: 'squat', order: 1, sets: 2 }] };

    const result = addExerciseToDay(copied, 1, 'bench-press');

    expect(result[1]?.map((e) => e.order)).toEqual([1, 2]);
  });

  // GT-155: a day takes an exercise once; another day takes it too.
  test('DoD: an exercise already in the day isn’t added again; another day takes it', () => {
    const existing: ExercisesByDay = { 1: [{ exerciseId: 'squat', order: 0, sets: 2 }] };

    expect(addExerciseToDay(existing, 1, 'squat')).toBe(existing);
    expect(addExerciseToDay(existing, 2, 'squat')[2]).toEqual([
      { exerciseId: 'squat', order: 0, sets: DEFAULT_EXERCISE_SETS },
    ]);
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

describe('reorderDayExercises', () => {
  test('reorders the day to match newOrder and reindexes order to array position', () => {
    const existing: ExercisesByDay = {
      1: [
        { exerciseId: 'squat', order: 0, sets: 2 },
        { exerciseId: 'bench-press', order: 1, sets: 3 },
        { exerciseId: 'row', order: 2, sets: 4 },
      ],
    };

    const result = reorderDayExercises(existing, 1, moveIndex(3, 0, 2));

    expect(result[1]).toEqual([
      { exerciseId: 'bench-press', order: 0, sets: 3 },
      { exerciseId: 'row', order: 1, sets: 4 },
      { exerciseId: 'squat', order: 2, sets: 2 },
    ]);
  });

  test('does not touch other days', () => {
    const existing: ExercisesByDay = {
      1: [
        { exerciseId: 'squat', order: 0, sets: 2 },
        { exerciseId: 'bench-press', order: 1, sets: 3 },
      ],
      2: [{ exerciseId: 'row', order: 0, sets: 4 }],
    };

    const result = reorderDayExercises(existing, 1, [1, 0]);

    expect(result[2]).toEqual([{ exerciseId: 'row', order: 0, sets: 4 }]);
  });
});

describe('reorderDays (GT-270)', () => {
  const week: ExercisesByDay = {
    1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }],
    2: [{ exerciseId: 'squat', order: 0, sets: 3 }],
    3: [{ exerciseId: 'row', order: 0, sets: 2 }],
  };

  test("moves the days' exercises, the numbers stay by position", () => {
    expect(reorderDays(week, [3, 1, 2])).toEqual({
      1: [{ exerciseId: 'row', order: 0, sets: 2 }],
      2: [{ exerciseId: 'bench-press', order: 0, sets: 3 }],
      3: [{ exerciseId: 'squat', order: 0, sets: 3 }],
    });
  });

  test('the order as it was changes nothing', () => {
    expect(reorderDays(week, [1, 2, 3])).toEqual(week);
  });

  test('a day with nothing yet moves as an empty day', () => {
    expect(reorderDays({ 1: week[1]! }, [2, 1])).toEqual({ 1: [], 2: week[1] });
  });

  test('leaves an entry beyond the week alone', () => {
    const withLeftover: ExercisesByDay = {
      ...week,
      4: [{ exerciseId: 'curl', order: 0, sets: 2 }],
    };
    expect(reorderDays(withLeftover, [2, 1, 3])[4]).toEqual(withLeftover[4]);
  });
});

describe('undoing a reorder (GT-270)', () => {
  const week: ExercisesByDay = {
    1: [{ exerciseId: 'bench-press', order: 0, sets: 3 }],
    2: [{ exerciseId: 'squat', order: 0, sets: 3 }],
    3: [{ exerciseId: 'row', order: 0, sets: 2 }],
  };

  test('only an order that moves a day has anything to undo', () => {
    expect(movesAnyDay([1, 2, 3])).toBe(false);
    expect(movesAnyDay([1, 3, 2])).toBe(true);
  });

  test('the inverse order puts every day back', () => {
    for (const order of [
      [3, 1, 2],
      [2, 3, 1],
      [1, 3, 2],
      [3, 2, 1],
    ]) {
      expect(reorderDays(reorderDays(week, order), invertDayOrder(order))).toEqual(week);
    }
  });

  test('a set changed after the move stays changed when the move is undone', () => {
    const moved = reorderDays(week, [3, 1, 2]);
    // Day 1 now holds the row; its sets go up before Undo.
    const edited: ExercisesByDay = { ...moved, 1: [{ exerciseId: 'row', order: 0, sets: 4 }] };

    expect(reorderDays(edited, invertDayOrder([3, 1, 2]))[3]).toEqual([
      { exerciseId: 'row', order: 0, sets: 4 },
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

describe('hybrid rows (GT-157)', () => {
  const exercisesById = {
    [BENCH_PRESS.id]: BENCH_PRESS,
    [MEDBALL_THROW.id]: MEDBALL_THROW,
    [HEAVY_BAG.id]: HEAVY_BAG,
    [COOLDOWN.id]: COOLDOWN,
  };
  test('formatSetCount pluralizes sets', () => {
    expect(formatSetCount(1)).toBe('1 set');
    expect(formatSetCount(3)).toBe('3 sets');
  });

  test('formatRoundCount pluralizes rounds', () => {
    expect(formatRoundCount(1)).toBe('1 round');
    expect(formatRoundCount(3)).toBe('3 rounds');
  });

  test("every row has a stepper but a mobility one: sets, or an interval's rounds (GT-190, GT-191)", () => {
    expect(hasSetsStepper(exercisesById, BENCH_PRESS.id)).toBe(true);
    expect(hasSetsStepper(exercisesById, MEDBALL_THROW.id)).toBe(true);
    expect(hasSetsStepper(exercisesById, HEAVY_BAG.id)).toBe(true);
    expect(hasSetsStepper(exercisesById, COOLDOWN.id)).toBe(false);
    expect(hasSetsStepper(exercisesById, 'missing')).toBe(true);
  });

  test("an interval's stepper counts rounds, every other one sets", () => {
    expect(stepperNoun(exercisesById, HEAVY_BAG.id)).toBe('rounds');
    expect(stepperNoun(exercisesById, MEDBALL_THROW.id)).toBe('sets');
    expect(stepperNoun(exercisesById, BENCH_PRESS.id)).toBe('sets');
  });

  test('exerciseSubtitle shows the type of an exercise without a muscle group', () => {
    expect(exerciseSubtitle(exercisesById, MEDBALL_THROW.id)).toBe('Power');
    expect(exerciseSubtitle(exercisesById, HEAVY_BAG.id)).toBe('Intervals');
    expect(exerciseSubtitle(exercisesById, COOLDOWN.id)).toBe('Mobility');
  });

  test('exerciseSubtitle keeps the muscle group of a hybrid exercise that has one', () => {
    const shoulderPower = { ...MEDBALL_THROW, muscleGroup: 'shoulders' as const };
    expect(exerciseSubtitle({ [MEDBALL_THROW.id]: shoulderPower }, MEDBALL_THROW.id)).toBe(
      'Shoulders',
    );
  });

  test('exerciseTypeIcon stands in for the dot only where there is no group colour', () => {
    expect(exerciseTypeIcon(exercisesById, HEAVY_BAG.id)).toBeDefined();
    expect(exerciseTypeIcon(exercisesById, BENCH_PRESS.id)).toBeUndefined();
    const shoulderPower = { ...MEDBALL_THROW, muscleGroup: 'shoulders' as const };
    expect(
      exerciseTypeIcon({ [MEDBALL_THROW.id]: shoulderPower }, MEDBALL_THROW.id),
    ).toBeUndefined();
    expect(exerciseTypeIcon(exercisesById, 'missing')).toBeUndefined();
  });

  test('a hybrid row is added, reordered and removed like a strength one', () => {
    let byDay: ExercisesByDay = {};
    byDay = addExerciseToDay(byDay, 1, BENCH_PRESS.id);
    byDay = addExerciseToDay(byDay, 1, HEAVY_BAG.id);
    byDay = addExerciseToDay(byDay, 1, COOLDOWN.id);
    byDay = reorderDayExercises(byDay, 1, [2, 0, 1]);
    expect(getDayExercises(byDay, 1).map((e) => [e.exerciseId, e.order])).toEqual([
      [COOLDOWN.id, 0],
      [BENCH_PRESS.id, 1],
      [HEAVY_BAG.id, 2],
    ]);
    byDay = removeExerciseFromDay(byDay, 1, 0);
    expect(getDayExercises(byDay, 1).map((e) => [e.exerciseId, e.order])).toEqual([
      [BENCH_PRESS.id, 0],
      [HEAVY_BAG.id, 1],
    ]);
  });
});
