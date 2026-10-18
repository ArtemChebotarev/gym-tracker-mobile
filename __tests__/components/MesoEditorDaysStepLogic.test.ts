import { toExerciseId } from '@domain/catalog';
import type { Exercise } from '@domain/catalog';
import { DEFAULT_EXERCISE_SETS } from '@domain/planValidators';
import {
  addExerciseToDay,
  canContinueFromDays,
  dragTargetIndex,
  exerciseDotColor,
  exercisePlan,
  exerciseSubtitle,
  exerciseTitle,
  exerciseTypeIcon,
  formatExercisePlan,
  formatSetCount,
  getDayExercises,
  getDayNumbers,
  moveIndex,
  planColumnLabel,
  removeExerciseFromDay,
  reorderDayExercises,
  updateExerciseSets,
  type ExercisesByDay,
} from '@components/MesoEditorDaysStepLogic';
import { COOLDOWN, HEAVY_BAG, HEAVY_BAG_CONFIG, MEDBALL_THROW } from '../fixtures/hybridExercises';
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

  // GT-148: a copied day arrives numbered from 1, so `existing.length` would repeat its last one.
  test('takes the order after the highest one, not the count', () => {
    const copied: ExercisesByDay = { 1: [{ exerciseId: 'squat', order: 1, sets: 2 }] };

    const result = addExerciseToDay(copied, 1, 'bench-press');

    expect(result[1]?.map((e) => e.order)).toEqual([1, 2]);
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

describe('dragTargetIndex', () => {
  const ROW_HEIGHT = 58;

  test('stays put when the drag distance is under half a row', () => {
    expect(dragTargetIndex(1, 20, 4, ROW_HEIGHT)).toBe(1);
    expect(dragTargetIndex(1, -20, 4, ROW_HEIGHT)).toBe(1);
  });

  test('moves down one row past the halfway point', () => {
    expect(dragTargetIndex(0, ROW_HEIGHT, 4, ROW_HEIGHT)).toBe(1);
  });

  test('moves up one row past the halfway point', () => {
    expect(dragTargetIndex(2, -ROW_HEIGHT, 4, ROW_HEIGHT)).toBe(1);
  });

  test('clamps to the last row rather than overshooting past the end', () => {
    expect(dragTargetIndex(0, ROW_HEIGHT * 10, 4, ROW_HEIGHT)).toBe(3);
  });

  test('clamps to the first row rather than going negative', () => {
    expect(dragTargetIndex(2, -ROW_HEIGHT * 10, 4, ROW_HEIGHT)).toBe(0);
  });

  test('is always computed from the total distance, not incrementally, so it cannot drift', () => {
    // Two calls with the same (fromIndex, distance) always agree, regardless of how many times
    // the caller re-evaluated it in between — there is no running state to get out of sync.
    expect(dragTargetIndex(0, ROW_HEIGHT * 2, 5, ROW_HEIGHT)).toBe(
      dragTargetIndex(0, ROW_HEIGHT * 2, 5, ROW_HEIGHT),
    );
  });
});

describe('moveIndex', () => {
  test('moves an item later, shifting the ones in between back by one', () => {
    expect(moveIndex(4, 0, 2)).toEqual([1, 2, 0, 3]);
  });

  test('moves an item earlier, shifting the ones in between forward by one', () => {
    expect(moveIndex(4, 3, 1)).toEqual([0, 3, 1, 2]);
  });

  test('is a no-op permutation when fromIndex equals toIndex', () => {
    expect(moveIndex(3, 1, 1)).toEqual([0, 1, 2]);
  });

  test('handles a single-item list', () => {
    expect(moveIndex(1, 0, 0)).toEqual([0]);
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
  const entry = (exerciseId: string, sets = 3) => ({ exerciseId, order: 0, sets });

  test('formatSetCount pluralizes sets', () => {
    expect(formatSetCount(1)).toBe('1 set');
    expect(formatSetCount(3)).toBe('3 sets');
  });

  test('formatExercisePlan reads each type the way the chip shows it', () => {
    expect(formatExercisePlan({ type: 'power', load: 'none', restSec: 60, noHeavierAvailable: false }, 4)).toEqual({
      value: '4 sets',
      caption: '1:00 rest',
    });
    expect(
      formatExercisePlan(
        { type: 'interval', workSec: 30, restSec: 60, getReadySec: 5, lever: 'rest', stepSec: 10, rounds: 6 },
        2,
      ),
    ).toEqual({ value: '6 × 0:30', caption: '1:00 rest' });
    expect(formatExercisePlan({ type: 'mobility', durationSec: 90 }, 2)).toEqual({ value: '1:30', caption: 'Length' });
  });

  test('exercisePlan: power takes the day\'s sets and the library rest', () => {
    expect(exercisePlan(exercisesById, entry(MEDBALL_THROW.id, 3))).toEqual({ value: '3 sets', caption: '1:15 rest' });
  });

  test('exercisePlan: interval takes the default rounds and the library times, not the day\'s sets', () => {
    expect(exercisePlan(exercisesById, entry(HEAVY_BAG.id, 2))).toEqual({ value: '3 × 2:00', caption: '0:45 rest' });
  });

  test('exercisePlan: the cycle’s own copy wins over the library (GT-158)', () => {
    const settings = { [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, restSec: 30, rounds: 6 } };
    expect(exercisePlan(exercisesById, entry(HEAVY_BAG.id), settings)).toEqual({
      value: '6 × 2:00',
      caption: '0:30 rest',
    });
  });

  test('exercisePlan: mobility shows its length', () => {
    expect(exercisePlan(exercisesById, entry(COOLDOWN.id))).toEqual({ value: '10:00', caption: 'Length' });
  });

  test('exercisePlan: falls back to the type defaults for a hybrid exercise without a config', () => {
    const { config: _config, ...withoutConfig } = COOLDOWN;
    expect(exercisePlan({ [COOLDOWN.id]: withoutConfig }, entry(COOLDOWN.id))).toEqual({
      value: '10:00',
      caption: 'Length',
    });
  });

  test('exercisePlan: undefined for strength and for an exercise not loaded yet', () => {
    expect(exercisePlan(exercisesById, entry(BENCH_PRESS.id))).toBeUndefined();
    expect(exercisePlan(exercisesById, entry('missing'))).toBeUndefined();
  });

  test('exerciseSubtitle shows the type of an exercise without a muscle group', () => {
    expect(exerciseSubtitle(exercisesById, MEDBALL_THROW.id)).toBe('Power');
    expect(exerciseSubtitle(exercisesById, HEAVY_BAG.id)).toBe('Timed work');
    expect(exerciseSubtitle(exercisesById, COOLDOWN.id)).toBe('Mobility');
  });

  test('exerciseSubtitle keeps the muscle group of a hybrid exercise that has one', () => {
    const shoulderPower = { ...MEDBALL_THROW, muscleGroup: 'shoulders' as const };
    expect(exerciseSubtitle({ [MEDBALL_THROW.id]: shoulderPower }, MEDBALL_THROW.id)).toBe('Shoulders');
  });

  test('exerciseTypeIcon stands in for the dot only where there is no group colour', () => {
    expect(exerciseTypeIcon(exercisesById, HEAVY_BAG.id)).toBeDefined();
    expect(exerciseTypeIcon(exercisesById, BENCH_PRESS.id)).toBeUndefined();
    const shoulderPower = { ...MEDBALL_THROW, muscleGroup: 'shoulders' as const };
    expect(exerciseTypeIcon({ [MEDBALL_THROW.id]: shoulderPower }, MEDBALL_THROW.id)).toBeUndefined();
    expect(exerciseTypeIcon(exercisesById, 'missing')).toBeUndefined();
  });

  test('planColumnLabel reads Sets for an all-strength day and Plan once a chip is in it', () => {
    expect(planColumnLabel(exercisesById, [entry(BENCH_PRESS.id)])).toBe('Sets');
    expect(planColumnLabel(exercisesById, [entry(BENCH_PRESS.id), entry(COOLDOWN.id)])).toBe('Plan');
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
