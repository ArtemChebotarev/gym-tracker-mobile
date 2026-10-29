import { toExerciseId, type Exercise } from '@domain/catalog';
import {
  exerciseSettingsFor,
  prunedExerciseSettings,
  weekPlanExerciseSettings,
  withExerciseSettings,
} from '@domain/exerciseSettingsBuilders';
import type { WeekPlan } from '@domain/plan';
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

describe('withExerciseSettings', () => {
  test('copies a hybrid exercise’s library config, rounds added for an interval one', () => {
    let settings = withExerciseSettings({}, MEDBALL_THROW);
    settings = withExerciseSettings(settings, HEAVY_BAG);
    settings = withExerciseSettings(settings, COOLDOWN);

    expect(settings).toEqual({
      [MEDBALL_THROW.id]: MEDBALL_THROW.config,
      [HEAVY_BAG.id]: { ...HEAVY_BAG.config },
      [COOLDOWN.id]: COOLDOWN.config,
    });
  });

  test('writes nothing for a strength exercise', () => {
    expect(withExerciseSettings({}, BENCH_PRESS)).toEqual({});
  });

  test('keeps the copy the cycle already has, edited or not', () => {
    const edited = { [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, lever: 'none' as const } } as const;

    expect(withExerciseSettings(edited, HEAVY_BAG)).toBe(edited);
  });

  test('falls back to the type’s system defaults for a hybrid exercise stored without a config', () => {
    const { config: _config, ...withoutConfig } = COOLDOWN;

    expect(withExerciseSettings({}, withoutConfig)).toEqual({
      [COOLDOWN.id]: { type: 'mobility' },
    });
  });

  test('the copy is the cycle’s own: changing it leaves the library config as it was', () => {
    const libraryConfig = structuredClone(HEAVY_BAG.config);
    const settings = withExerciseSettings({}, HEAVY_BAG);

    const copy = settings[HEAVY_BAG.id]!;
    if (copy.type === 'interval') {
      copy.lever = 'none';
    }

    expect(HEAVY_BAG.config).toEqual(libraryConfig);
  });
});

describe('prunedExerciseSettings', () => {
  test('keeps only the exercises the cycle still has', () => {
    const settings = withExerciseSettings(withExerciseSettings({}, HEAVY_BAG), COOLDOWN);

    expect(prunedExerciseSettings(settings, [COOLDOWN.id, BENCH_PRESS.id])).toEqual({
      [COOLDOWN.id]: COOLDOWN.config,
    });
    expect(prunedExerciseSettings(settings, [])).toEqual({});
  });
});

describe('weekPlanExerciseSettings (GT-159)', () => {
  const weekPlan: WeekPlan = {
    days: [
      {
        dayNumber: 1,
        name: '',
        exercises: [
          { exerciseId: BENCH_PRESS.id, order: 1, sets: 3 },
          { exerciseId: HEAVY_BAG.id, order: 2, sets: 2 },
        ],
      },
      {
        dayNumber: 2,
        name: '',
        exercises: [
          { exerciseId: HEAVY_BAG.id, order: 1, sets: 2 },
          { exerciseId: COOLDOWN.id, order: 2, sets: 2 },
        ],
      },
    ],
  };
  const library = [BENCH_PRESS, HEAVY_BAG, COOLDOWN, MEDBALL_THROW];

  test('without inherited settings every hybrid exercise gets the library’s — Flow B', () => {
    expect(weekPlanExerciseSettings(weekPlan, library)).toEqual({
      [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG },
      [COOLDOWN.id]: COOLDOWN.config,
    });
  });

  test('inherited settings win; an exercise they lack falls back to the library — Flow C', () => {
    const fromSource = {
      [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, lever: 'none' as const },
      // The source had this one, but the copied week does not: it stays behind.
      [MEDBALL_THROW.id]: { type: 'power' as const, load: 'weight' as const, restSec: 90, noHeavierAvailable: true },
    };

    expect(weekPlanExerciseSettings(weekPlan, library, fromSource)).toEqual({
      [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, lever: 'none' as const },
      [COOLDOWN.id]: COOLDOWN.config,
    });
  });

  test('the result is a copy: changing it leaves the inherited settings alone', () => {
    const fromSource = { [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG } };
    const settings = weekPlanExerciseSettings(weekPlan, library, fromSource);

    expect(settings[HEAVY_BAG.id]).not.toBe(fromSource[HEAVY_BAG.id]);
  });

  test('an exercise the library has no record of gets nothing', () => {
    expect(weekPlanExerciseSettings(weekPlan, [BENCH_PRESS])).toEqual({});
  });
});

describe('exerciseSettingsFor', () => {
  test('the cycle’s own copy, the library’s while there is none, nothing for strength', () => {
    const own = { [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG } };

    expect(exerciseSettingsFor(own, HEAVY_BAG)).toEqual({ ...HEAVY_BAG_CONFIG });
    expect(exerciseSettingsFor({}, HEAVY_BAG)).toEqual({ ...HEAVY_BAG_CONFIG });
    expect(exerciseSettingsFor({}, BENCH_PRESS)).toBeUndefined();
  });
});
