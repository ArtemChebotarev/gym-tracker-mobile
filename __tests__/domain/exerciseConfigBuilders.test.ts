import type { Exercise } from '@domain/catalog';
import { toExerciseId } from '@domain/catalog';
import { defaultExerciseConfig, exerciseTypeOf } from '@domain/exerciseConfigBuilders';
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

  test('give power one minute of rest and no "no heavier" flag (10.1, FR-9)', () => {
    expect(defaultExerciseConfig('power')).toEqual({
      type: 'power',
      load: 'weight',
      restSec: 60,
      noHeavierAvailable: false,
    });
  });

  test('give interval 3 x 2:00 with 1:00 rest, 5 s get ready, the rest lever and a 15 s step', () => {
    expect(defaultExerciseConfig('interval')).toEqual({
      type: 'interval',
      rounds: 3,
      workSec: 120,
      restSec: 60,
      getReadySec: 5,
      lever: 'rest',
      stepSec: 15,
    });
  });

  test('give mobility ten minutes', () => {
    expect(defaultExerciseConfig('mobility')).toEqual({ type: 'mobility', durationSec: 600 });
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
