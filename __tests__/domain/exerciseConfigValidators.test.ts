import { isConflictError } from '@domain/errors';
import type { IntervalConfig, MobilityConfig, PowerConfig } from '@domain/exerciseConfig';
import { defaultExerciseConfig } from '@domain/exerciseConfigBuilders';
import {
  assertTypeUnchanged,
  validateExerciseConfig,
  validateExerciseMuscleGroupFor,
  validateExerciseType,
} from '@domain/exerciseConfigValidators';

const interval = (overrides: Partial<IntervalConfig> = {}): IntervalConfig => ({
  ...(defaultExerciseConfig('interval') as IntervalConfig),
  ...overrides,
});
const power = (overrides: Partial<PowerConfig> = {}): PowerConfig => ({
  ...(defaultExerciseConfig('power') as PowerConfig),
  ...overrides,
});
const mobility = (overrides: Partial<MobilityConfig> = {}): MobilityConfig => ({
  ...(defaultExerciseConfig('mobility') as MobilityConfig),
  ...overrides,
});

describe('validateExerciseType', () => {
  test('accept the four types', () => {
    for (const type of ['strength', 'power', 'interval', 'mobility'] as const) {
      expect(() => validateExerciseType(type)).not.toThrow();
    }
  });

  test('reject anything else', () => {
    expect(() => validateExerciseType('carry' as never)).toThrow('Unknown exercise type');
  });
});

describe('validateExerciseMuscleGroupFor', () => {
  test('accept a real group on every type', () => {
    for (const type of ['strength', 'power', 'interval', 'mobility'] as const) {
      expect(() => validateExerciseMuscleGroupFor(type, 'quads')).not.toThrow();
    }
  });

  test('accept fullBody on the types that have no one group', () => {
    for (const type of ['power', 'interval', 'mobility'] as const) {
      expect(() => validateExerciseMuscleGroupFor(type, 'fullBody')).not.toThrow();
    }
  });

  test('refuse fullBody on a strength exercise, which is counted into volume by its group', () => {
    expect(() => validateExerciseMuscleGroupFor('strength', 'fullBody')).toThrow(
      'needs a muscle group',
    );
  });

  test('refuse a group that does not exist', () => {
    expect(() => validateExerciseMuscleGroupFor('power', 'neck' as never)).toThrow(
      'Unknown muscle group',
    );
  });
});

describe('validateExerciseConfig', () => {
  test('want no config on a strength exercise', () => {
    expect(() => validateExerciseConfig('strength', undefined)).not.toThrow();
    expect(() => validateExerciseConfig('strength', power())).toThrow('no config');
  });

  test('want a config on every other type', () => {
    for (const type of ['power', 'interval', 'mobility'] as const) {
      expect(() => validateExerciseConfig(type, undefined)).toThrow('needs a config');
    }
  });

  test('refuse a config of another type', () => {
    expect(() => validateExerciseConfig('interval', power())).toThrow(
      'cannot carry a power config',
    );
  });

  test('accept a valid power config of each load', () => {
    for (const load of ['weight', 'level', 'none'] as const) {
      expect(() => validateExerciseConfig('power', power({ load }))).not.toThrow();
    }
  });

  test('refuse an unknown power load and a negative or fractional rest', () => {
    expect(() => validateExerciseConfig('power', power({ load: 'speed' as never }))).toThrow(
      'Unknown power load',
    );
    expect(() => validateExerciseConfig('power', power({ restSec: -1 }))).toThrow('Rest');
    expect(() => validateExerciseConfig('power', power({ restSec: 30.5 }))).toThrow('Rest');
  });

  test('accept zero rest on power and interval, which is "go straight on"', () => {
    expect(() => validateExerciseConfig('power', power({ restSec: 0 }))).not.toThrow();
    expect(() => validateExerciseConfig('interval', interval({ restSec: 0 }))).not.toThrow();
  });

  test('refuse an interval without work time', () => {
    expect(() => validateExerciseConfig('interval', interval({ workSec: 0 }))).toThrow('Work time');
  });

  test('refuse a lever or a step outside the ones the first version has', () => {
    expect(() =>
      validateExerciseConfig('interval', interval({ lever: 'output' as never })),
    ).toThrow('Unknown interval lever');
    expect(() => validateExerciseConfig('interval', interval({ stepSec: 20 as never }))).toThrow(
      'step must be one of 5, 10, 15',
    );
  });

  test('accept every lever and step', () => {
    for (const lever of ['rest', 'workTime', 'rounds', 'none'] as const) {
      expect(() => validateExerciseConfig('interval', interval({ lever }))).not.toThrow();
    }
    for (const stepSec of [5, 10, 15] as const) {
      expect(() => validateExerciseConfig('interval', interval({ stepSec }))).not.toThrow();
    }
  });

  test('refuse a mobility without a length', () => {
    expect(() => validateExerciseConfig('mobility', mobility({ durationSec: 0 }))).toThrow(
      'Duration',
    );
  });
});

describe('assertTypeUnchanged', () => {
  function conflictOf(call: () => void): unknown {
    try {
      call();
    } catch (error) {
      return error;
    }
    return undefined;
  }

  test('refuse a change of type once the exercise has history, with a ConflictError', () => {
    const error = conflictOf(() => assertTypeUnchanged('strength', 'power', true));

    expect(isConflictError(error)).toBe(true);
    expect((error as Error).message).toContain('create a new exercise');
  });

  test('allow a change of type while nothing has been logged', () => {
    expect(() => assertTypeUnchanged('strength', 'interval', false)).not.toThrow();
  });

  test('allow keeping the type whatever the history', () => {
    expect(() => assertTypeUnchanged('power', 'power', true)).not.toThrow();
  });
});
