import type { Mesocycle, MesocycleOrigin } from '@domain/mesocycle';
import {
  defaultProgressionSettings,
  validateMesocycleDaysPerWeek,
  validateMesocycleImmutableFields,
  validateMesocycleLengthWeeks,
  validateSingleActiveMesocycle,
} from '@domain/mesocycle';

function describeOrigin(origin: MesocycleOrigin): string {
  switch (origin.type) {
    case 'scratch':
      return 'built from scratch';
    case 'template':
      // `templateId` is only reachable once narrowed to the `template` variant.
      return `built from template ${origin.templateId}`;
    case 'copyWeek':
      // `sourceMesoId` / `sourceWeekNumber` are only reachable once narrowed to `copyWeek`.
      return `copied week ${origin.sourceWeekNumber} from meso ${origin.sourceMesoId}`;
  }
}

const scratchOrigin: MesocycleOrigin = { type: 'scratch' };
const templateOrigin: MesocycleOrigin = { type: 'template', templateId: 'template-1' };
const copyWeekOrigin: MesocycleOrigin = {
  type: 'copyWeek',
  sourceMesoId: 'meso-1',
  sourceWeekNumber: 3,
};

const mesocycleFixture: Mesocycle = {
  id: 'meso-1',
  name: 'Push/Pull/Legs',
  lengthWeeks: 6,
  daysPerWeek: 4,
  startDate: '2026-08-24T00:00:00.000Z',
  status: 'active',
  origin: scratchOrigin,
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-08-24T00:00:00.000Z',
};

describe('mesocycle domain types', () => {
  test('origin narrows on `type` without casts, in a switch', () => {
    expect(describeOrigin(scratchOrigin)).toBe('built from scratch');
    expect(describeOrigin(templateOrigin)).toBe('built from template template-1');
    expect(describeOrigin(copyWeekOrigin)).toBe('copied week 3 from meso meso-1');
  });

  test('origin narrows on `type` without casts, in an if/else chain', () => {
    function assertNarrowing(origin: MesocycleOrigin): void {
      if (origin.type === 'scratch') {
        throw new Error('unexpected scratch origin');
      } else if (origin.type === 'template') {
        expect(origin.templateId).toBe('template-1');
      } else {
        expect(origin.sourceMesoId).toBeDefined();
        expect(origin.sourceWeekNumber).toBeDefined();
      }
    }

    assertNarrowing(templateOrigin);
  });

  test('a full mesocycle fixture typechecks', () => {
    expect(mesocycleFixture.status).toBe('active');
    expect(mesocycleFixture.completedAt).toBeUndefined();
  });

  test('defaultProgressionSettings matches the spec defaults', () => {
    expect(defaultProgressionSettings).toEqual({
      minReps: 5,
      maxReps: 30,
      deloadRir: 8,
      deloadWeightFactor: 0.5,
    });
  });
});

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
