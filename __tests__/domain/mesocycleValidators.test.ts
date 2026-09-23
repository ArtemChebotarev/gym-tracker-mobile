import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  validateCopyableSourceWeek,
  validateMesocycleDaysPerWeek,
  validateMesocycleImmutableFields,
  validateMesocycleLengthWeeks,
  validateWeekPlanDayCount,
} from '@domain/mesocycleValidators';
import type { WeekPlan } from '@domain/plan';
import { STAMPS } from '../fixtures/stamps';

const mesocycleFixture: Mesocycle = {
  ...STAMPS,
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

describe('validateWeekPlanDayCount', () => {
  const twoDayWeekPlan: WeekPlan = {
    days: [
      { dayNumber: 1, name: '', exercises: [] },
      { dayNumber: 2, name: '', exercises: [] },
    ],
  };

  test('accepts a weekPlan whose day count matches daysPerWeek', () => {
    expect(() => validateWeekPlanDayCount(twoDayWeekPlan, 2)).not.toThrow();
  });

  test('rejects a weekPlan with too few days', () => {
    expect(() => validateWeekPlanDayCount(twoDayWeekPlan, 3)).toThrow(
      /WeekPlan must have exactly 3 day\(s\) to match daysPerWeek, got 2/,
    );
  });

  test('rejects a weekPlan with too many days', () => {
    expect(() => validateWeekPlanDayCount(twoDayWeekPlan, 1)).toThrow(
      /WeekPlan must have exactly 1 day\(s\) to match daysPerWeek, got 2/,
    );
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

describe('validateCopyableSourceWeek', () => {
  // A 6-week block has 5 working weeks and deloads on week 6.
  const sixWeeks = { lengthWeeks: 6 };

  // DoD (task 041): Flow C refuses the deload week.
  test('rejects the deload week — the block’s last one', () => {
    expect(() => validateCopyableSourceWeek(sixWeeks, 6)).toThrow(/deload week/);
  });

  test.each([1, 2, 3, 4, 5])('accepts working week %i', (weekNumber) => {
    expect(() => validateCopyableSourceWeek(sixWeeks, weekNumber)).not.toThrow();
  });

  test('follows the source’s own length, not a fixed week number', () => {
    expect(() => validateCopyableSourceWeek({ lengthWeeks: 3 }, 3)).toThrow(/deload week/);
    expect(() => validateCopyableSourceWeek({ lengthWeeks: 8 }, 3)).not.toThrow();
  });
});
