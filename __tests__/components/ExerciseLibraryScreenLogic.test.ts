import { toExerciseId, type Exercise } from '@domain/catalog';
import type { ExerciseListGroup } from '@domain/catalogListing';
import type { SetLog } from '@domain/execution';

import type { ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';
import {
  buildSections,
  countEntries,
  formatSubtitle,
  hasActiveFilters,
  sectionDotColor,
  sourceLabel,
} from '@components/ExerciseLibraryScreenLogic';

function exercise(overrides: Partial<Exercise> & Pick<Exercise, 'id' | 'name' | 'muscleGroup'>): Exercise {
  return { source: 'catalog', isHidden: false, ...overrides };
}

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
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
          { exercise: exercise({ id: toExerciseId('a'), name: 'A', muscleGroup: 'back' }), lastSetLog: null },
          { exercise: exercise({ id: toExerciseId('b'), name: 'B', muscleGroup: 'back' }), lastSetLog: null },
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
      { muscleGroup: 'back', title: 'Back', data: [] },
      { muscleGroup: 'chest', title: 'Chest', data: [] },
    ]);
  });
});
