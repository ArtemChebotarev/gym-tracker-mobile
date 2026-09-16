import { EXERCISE_CATALOG } from '@domain/exerciseCatalog';
import { buildMockMesocycles } from '@domain/mesocycleMocks';
import {
  validateMesocycleDaysPerWeek,
  validateMesocycleLengthWeeks,
  validateSingleActiveMesocycle,
  validateWeekPlanDayCount,
} from '@domain/mesocycleValidators';

const NOW = new Date('2026-09-16T12:00:00.000Z');

describe('buildMockMesocycles', () => {
  test('has exactly one active, one planned, and one completed mesocycle', () => {
    const statuses = buildMockMesocycles(NOW)
      .map((mesocycle) => mesocycle.status)
      .sort();

    expect(statuses).toEqual(['active', 'completed', 'planned']);
  });

  test('every mock satisfies the domain invariants', () => {
    const mocks = buildMockMesocycles(NOW);

    expect(() => validateSingleActiveMesocycle(mocks)).not.toThrow();
    for (const mesocycle of mocks) {
      expect(() => validateMesocycleLengthWeeks(mesocycle.lengthWeeks)).not.toThrow();
      expect(() => validateMesocycleDaysPerWeek(mesocycle.daysPerWeek)).not.toThrow();
      if (mesocycle.status === 'planned') {
        expect(mesocycle.startDate).toBeUndefined();
        expect(() =>
          validateWeekPlanDayCount(mesocycle.weekPlan!, mesocycle.daysPerWeek),
        ).not.toThrow();
      } else {
        expect(mesocycle.startDate).toBeDefined();
        expect(mesocycle.weekPlan).toBeUndefined();
      }
    }
  });

  test("the planned mock's week plan only references catalog exercises", () => {
    const catalogIds = new Set<string>(EXERCISE_CATALOG.map((exercise) => exercise.id));
    const planned = buildMockMesocycles(NOW).find((mesocycle) => mesocycle.status === 'planned')!;

    for (const day of planned.weekPlan!.days) {
      for (const exercise of day.exercises) {
        expect(catalogIds.has(exercise.exerciseId)).toBe(true);
      }
    }
  });
});
