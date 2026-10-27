import type { Exercise } from '@domain/catalog';
import { toExerciseId } from '@domain/catalog';
import {
  DEFAULT_INTERVAL_ROUNDS,
  defaultExerciseSettings,
  defaultExerciseConfig,
  exerciseTypeOf,
  holdIntervalConfig,
} from '@domain/exerciseConfigBuilders';
import { validateExerciseConfig } from '@domain/exerciseConfigValidators';
import { STAMPS } from '../fixtures/stamps';

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    ...STAMPS,
    id: toExerciseId('exercise-bench-press'),
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'catalog',
    isHidden: false,
    ...overrides,
  };
}

describe('exerciseTypeOf', () => {
  test('read an exercise that says nothing as strength', () => {
    expect(exerciseTypeOf(makeExercise())).toBe('strength');
  });

  test('read the type an exercise carries', () => {
    expect(exerciseTypeOf(makeExercise({ type: 'interval' }))).toBe('interval');
  });
});

describe('defaultExerciseConfig', () => {
  test('give strength no config', () => {
    expect(defaultExerciseConfig('strength')).toBeUndefined();
  });

  test('give power the weight load and no "no heavier" flag (10.1, FR-9) — its rest is a setting (GT-188)', () => {
    expect(defaultExerciseConfig('power')).toEqual({
      type: 'power',
      load: 'weight',
      noHeavierAvailable: false,
    });
  });

  test('give interval the rest lever and a 10 s step, no times — they come from history (GT-191)', () => {
    expect(defaultExerciseConfig('interval')).toEqual({
      type: 'interval',
      lever: 'rest',
      stepSec: 10,
    });
  });

  test('give mobility nothing to set: its length comes from history (GT-191)', () => {
    expect(defaultExerciseConfig('mobility')).toEqual({ type: 'mobility' });
  });

  test('hand out a fresh object each time, so two exercises never share one', () => {
    expect(defaultExerciseConfig('interval')).not.toBe(defaultExerciseConfig('interval'));
  });

  test('produce configs its own validator accepts, for every type', () => {
    for (const type of ['strength', 'power', 'interval', 'mobility'] as const) {
      expect(() => validateExerciseConfig(type, defaultExerciseConfig(type))).not.toThrow();
    }
  });
});

describe('holdIntervalConfig', () => {
  test('give Hold the work time lever and a 5 s step, no times (10.1, FR-16, GT-191)', () => {
    expect(holdIntervalConfig()).toEqual({
      type: 'interval',
      lever: 'workTime',
      stepSec: 5,
    });
  });

  test('be a config the interval validator accepts', () => {
    expect(() => validateExerciseConfig('interval', holdIntervalConfig())).not.toThrow();
  });

  test('hand out a fresh object each time', () => {
    expect(holdIntervalConfig()).not.toBe(holdIntervalConfig());
  });
});

describe('defaultExerciseSettings', () => {
  it('copies an interval config and adds the default round count', () => {
    const config = defaultExerciseConfig('interval')!;
    expect(defaultExerciseSettings(config)).toEqual({ ...config, rounds: DEFAULT_INTERVAL_ROUNDS });
  });

  it('copies a power and a mobility config as they are', () => {
    const power = defaultExerciseConfig('power')!;
    const mobility = defaultExerciseConfig('mobility')!;
    expect(defaultExerciseSettings(power)).toEqual(power);
    expect(defaultExerciseSettings(mobility)).toEqual(mobility);
  });

  it('returns a copy, so editing it leaves the library config alone', () => {
    const config = defaultExerciseConfig('mobility')!;
    const settings = defaultExerciseSettings(config);
    expect(settings).not.toBe(config);
  });
});
