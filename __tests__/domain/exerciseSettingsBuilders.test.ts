import { toExerciseId, type Exercise } from '@domain/catalog';
import { DEFAULT_INTERVAL_ROUNDS } from '@domain/exerciseConfigBuilders';
import {
  prunedExerciseSettings,
  resetExerciseSettings,
  withExerciseSettings,
} from '@domain/exerciseSettingsBuilders';
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
      [HEAVY_BAG.id]: { ...HEAVY_BAG.config, rounds: DEFAULT_INTERVAL_ROUNDS },
      [COOLDOWN.id]: COOLDOWN.config,
    });
  });

  test('writes nothing for a strength exercise', () => {
    expect(withExerciseSettings({}, BENCH_PRESS)).toEqual({});
  });

  test('keeps the copy the cycle already has, edited or not', () => {
    const edited = { [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, restSec: 30, rounds: 5 } } as const;

    expect(withExerciseSettings(edited, HEAVY_BAG)).toBe(edited);
  });

  test('falls back to the type’s system defaults for a hybrid exercise stored without a config', () => {
    const { config: _config, ...withoutConfig } = COOLDOWN;

    expect(withExerciseSettings({}, withoutConfig)).toEqual({
      [COOLDOWN.id]: { type: 'mobility', durationSec: 600 },
    });
  });

  test('the copy is the cycle’s own: changing it leaves the library config as it was', () => {
    const libraryConfig = structuredClone(HEAVY_BAG.config);
    const settings = withExerciseSettings({}, HEAVY_BAG);

    const copy = settings[HEAVY_BAG.id]!;
    if (copy.type === 'interval') {
      copy.restSec = 15;
      copy.rounds = 8;
    }

    expect(HEAVY_BAG.config).toEqual(libraryConfig);
  });
});

describe('resetExerciseSettings', () => {
  test('puts the library values back, rounds included', () => {
    const edited = {
      [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, restSec: 30, rounds: 6 },
      [COOLDOWN.id]: { type: 'mobility' as const, durationSec: 300 },
    };

    expect(resetExerciseSettings(edited, HEAVY_BAG)).toEqual({
      [HEAVY_BAG.id]: { ...HEAVY_BAG.config, rounds: DEFAULT_INTERVAL_ROUNDS },
      [COOLDOWN.id]: { type: 'mobility', durationSec: 300 },
    });
  });

  test('changes nothing for a strength exercise', () => {
    const settings = { [COOLDOWN.id]: { type: 'mobility' as const, durationSec: 600 } };

    expect(resetExerciseSettings(settings, BENCH_PRESS)).toBe(settings);
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
