import { toExerciseId, type Exercise } from '@domain/catalog';
import type { ExerciseListGroup } from '@domain/catalogListing';
import type { SetLog } from '@domain/execution';

import type { ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';
import {
  buildSections,
  countEntries,
  equipmentSuffix,
  formatSubtitle,
  hasActiveFilters,
  rowSubtitle,
  sectionDotColor,
  sourceLabel,
} from '@components/ExerciseLibraryScreenLogic';
import { STAMPS } from '../fixtures/stamps';

function exercise(
  overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'name' | 'muscleGroup'>,
): Exercise {
  return { ...STAMPS, source: 'catalog', isHidden: false, ...overrides };
}

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    ...STAMPS,
    id: 'set-1',
    sessionExerciseId: 'session-exercise-1',
    exerciseId: 'bench-press',
    setNumber: 1,
    weight: 85,
    reps: 8,
    completedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

describe('hasActiveFilters', () => {
  test('false when no filter is set', () => {
    expect(hasActiveFilters({})).toBe(false);
  });

  test.each<[string, ExerciseLibraryFilters]>([
    ['muscleGroups', { muscleGroups: ['chest'] }],
    ['sources', { sources: ['custom'] }],
    ['performedOnly', { performedOnly: true }],
  ])('true when %s is set', (_label, filters) => {
    expect(hasActiveFilters(filters)).toBe(true);
  });
});

describe('countEntries', () => {
  test('sums entries across all groups', () => {
    const groups: ExerciseListGroup[] = [
      { muscleGroup: 'chest', entries: [] },
      {
        muscleGroup: 'back',
        entries: [
          {
            exercise: exercise({ id: toExerciseId('a'), name: 'A', muscleGroup: 'back' }),
            lastSetLog: null,
            lastRoundLog: null,
          },
          {
            exercise: exercise({ id: toExerciseId('b'), name: 'B', muscleGroup: 'back' }),
            lastSetLog: null,
            lastRoundLog: null,
          },
        ],
      },
    ];

    expect(countEntries(groups)).toBe(2);
  });
});

describe('formatSubtitle', () => {
  test('"Never performed" when there is no last set log', () => {
    expect(formatSubtitle(null)).toBe('Never performed');
  });

  test('weight, reps, and a relative date when there is a last set log', () => {
    expect(formatSubtitle(setLog({ weight: 85, reps: 8 }))).toContain('85 kg × 8');
  });

  test('a power set on levels reads as a level', () => {
    expect(formatSubtitle(setLog({ weight: 2, reps: 3 }), 'power', 'level')).toMatch(
      /^Power · Level 2 × 3 · /,
    );
  });

  test('a round reads as the work it ran', () => {
    const round = {
      ...setLog(),
      roundNumber: 1,
      workSec: 120,
      restSec: 60,
      restSkipped: false,
      completed: true,
    };

    expect(formatSubtitle(round, 'interval')).toMatch(/^Timed work · 2:00 · /);
  });
});

describe('sectionDotColor', () => {
  test('resolves a color for a known muscle group', () => {
    expect(sectionDotColor('chest')).toBeTruthy();
  });
});

describe('sourceLabel', () => {
  test('labels catalog and custom sources', () => {
    expect(sourceLabel('catalog')).toBe('Catalog');
    expect(sourceLabel('custom')).toBe('Custom');
  });
});

describe('buildSections', () => {
  test('maps each group to a section with a display title, preserving order', () => {
    const groups: ExerciseListGroup[] = [
      { muscleGroup: 'back', entries: [] },
      { muscleGroup: 'chest', entries: [] },
    ];

    expect(buildSections(groups)).toEqual([
      { key: 'back', muscleGroup: 'back', title: 'Back', data: [] },
      { key: 'chest', muscleGroup: 'chest', title: 'Chest', data: [] },
    ]);
  });

  test('names the sections of exercises without a group by type, each with its own key', () => {
    const groups: ExerciseListGroup[] = [
      { muscleGroup: 'fullBody', type: 'power', entries: [] },
      { muscleGroup: 'fullBody', type: 'interval', entries: [] },
      { muscleGroup: 'fullBody', type: 'mobility', entries: [] },
    ];

    const sections = buildSections(groups);

    expect(sections.map((section) => section.title)).toEqual(['Power', 'Intervals', 'Mobility']);
    expect(new Set(sections.map((section) => section.key)).size).toBe(3);
  });
});

describe('equipmentSuffix', () => {
  test('the equipment label when the exercise has equipment', () => {
    expect(
      equipmentSuffix(
        exercise({
          id: toExerciseId('db-bench'),
          name: 'Bench Press',
          muscleGroup: 'chest',
          equipment: 'dumbbell',
        }),
      ),
    ).toBe('Dumbbell');
  });

  test('undefined when the exercise has no equipment', () => {
    expect(
      equipmentSuffix(
        exercise({ id: toExerciseId('my-fly'), name: 'My Fly', muscleGroup: 'chest' }),
      ),
    ).toBeUndefined();
  });
});

describe("the type in a row's subtitle", () => {
  test('is left out for Strength and said for the hybrid types', () => {
    expect(formatSubtitle(null)).toBe('Never performed');
    expect(formatSubtitle(null, 'strength')).toBe('Never performed');
    expect(formatSubtitle(null, 'power')).toBe('Power · Never performed');
    expect(formatSubtitle(null, 'interval')).toBe('Timed work · Never performed');
    expect(formatSubtitle(null, 'mobility')).toBe('Mobility · Never performed');
  });

  test('is read from the entry: an exercise with no type is Strength', () => {
    const plain = exercise({ id: toExerciseId('e1'), name: 'Bench Press', muscleGroup: 'chest' });
    const slam = exercise({
      id: toExerciseId('e2'),
      name: 'Slam',
      muscleGroup: 'fullBody',
      type: 'power',
    });

    expect(rowSubtitle({ exercise: plain, lastSetLog: null, lastRoundLog: null })).toBe(
      'Never performed',
    );
    expect(rowSubtitle({ exercise: slam, lastSetLog: null, lastRoundLog: null })).toBe(
      'Power · Never performed',
    );
  });
});

describe('hasActiveFilters with a type', () => {
  test('a chosen type is an active filter', () => {
    expect(hasActiveFilters({ types: ['power'] })).toBe(true);
    expect(hasActiveFilters({ types: undefined })).toBe(false);
  });
});
