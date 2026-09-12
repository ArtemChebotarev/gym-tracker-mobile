import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  validateMesocycleDaysPerWeek,
  validateMesocycleImmutableFields,
  validateMesocycleLengthWeeks,
  validateSingleActiveMesocycle,
} from '@domain/mesocycleValidators';

const mesocycleFixture: Mesocycle = {
  id: 'meso-1',
  name: 'Push/Pull/Legs',
  lengthWeeks: 6,
  daysPerWeek: 4,
  startDate: '2026-08-24T00:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-08-24T00:00:00.000Z',
};

describe('validateMesocycleLengthWeeks', () => {
  test.each([3, 8])('accepts the boundary value %i', (lengthWeeks) => {
    expect(() => validateMesocycleLengthWeeks(lengthWeeks)).not.toThrow();
  });

  test.each([2, 9])('rejects the out-of-range value %i', (lengthWeeks) => {
    expect(() => validateMesocycleLengthWeeks(lengthWeeks)).toThrow(
      /lengthWeeks must be between 3 and 8/,
    );
  });
});

describe('validateMesocycleDaysPerWeek', () => {
  test.each([1, 7])('accepts the boundary value %i', (daysPerWeek) => {
    expect(() => validateMesocycleDaysPerWeek(daysPerWeek)).not.toThrow();
  });

  test.each([0, 8])('rejects the out-of-range value %i', (daysPerWeek) => {
    expect(() => validateMesocycleDaysPerWeek(daysPerWeek)).toThrow(
      /daysPerWeek must be between 1 and 7/,
    );
  });
});

describe('validateSingleActiveMesocycle', () => {
  const completedMeso: Mesocycle = { ...mesocycleFixture, id: 'meso-2', status: 'completed' };
  const secondActiveMeso: Mesocycle = { ...mesocycleFixture, id: 'meso-3', status: 'active' };

  test('accepts a collection with zero or one active mesocycle', () => {
    expect(() => validateSingleActiveMesocycle([])).not.toThrow();
    expect(() => validateSingleActiveMesocycle([completedMeso])).not.toThrow();
    expect(() => validateSingleActiveMesocycle([mesocycleFixture, completedMeso])).not.toThrow();
  });

  test('rejects a collection with more than one active mesocycle', () => {
    expect(() =>
      validateSingleActiveMesocycle([mesocycleFixture, secondActiveMeso, completedMeso]),
    ).toThrow(/Only one mesocycle may be active/);
  });
});

describe('validateMesocycleImmutableFields', () => {
  test('accepts an update that keeps lengthWeeks and daysPerWeek unchanged', () => {
    const next: Mesocycle = { ...mesocycleFixture, name: 'Renamed block' };

    expect(() => validateMesocycleImmutableFields(mesocycleFixture, next)).not.toThrow();
  });

  test('rejects an update that changes lengthWeeks', () => {
    const next: Mesocycle = { ...mesocycleFixture, lengthWeeks: mesocycleFixture.lengthWeeks + 1 };

    expect(() => validateMesocycleImmutableFields(mesocycleFixture, next)).toThrow(
      /lengthWeeks is immutable/,
    );
  });

  test('rejects an update that changes daysPerWeek', () => {
    const next: Mesocycle = { ...mesocycleFixture, daysPerWeek: mesocycleFixture.daysPerWeek + 1 };

    expect(() => validateMesocycleImmutableFields(mesocycleFixture, next)).toThrow(
      /daysPerWeek is immutable/,
    );
  });
});
