import type { ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';
import {
  applyButtonLabel,
  FILTER_MUSCLE_GROUPS,
  toggleMuscleGroup,
  toggleSource,
  toggleType,
} from '@components/ExerciseFiltersSheetLogic';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';
import { MUSCLE_GROUPS } from '@domain/catalog';

describe('toggleMuscleGroup', () => {
  test('adds a muscle group that is not yet selected', () => {
    expect(toggleMuscleGroup({}, 'chest')).toEqual({ muscleGroups: ['chest'] });
  });

  test('removes a muscle group that is already selected', () => {
    const filters: ExerciseLibraryFilters = { muscleGroups: ['chest', 'back'] };

    expect(toggleMuscleGroup(filters, 'chest')).toEqual({ muscleGroups: ['back'] });
  });

  test('deselecting the last muscle group clears the field, not an empty array — an empty selection means every group', () => {
    const filters: ExerciseLibraryFilters = { muscleGroups: ['chest'] };

    expect(toggleMuscleGroup(filters, 'chest')).toEqual({ muscleGroups: undefined });
  });

  test('leaves other filter fields untouched', () => {
    const filters: ExerciseLibraryFilters = { sources: ['custom'], performedOnly: true };

    expect(toggleMuscleGroup(filters, 'chest')).toEqual({
      sources: ['custom'],
      performedOnly: true,
      muscleGroups: ['chest'],
    });
  });
});

describe('toggleSource', () => {
  test('adds a source that is not yet selected', () => {
    expect(toggleSource({}, 'catalog')).toEqual({ sources: ['catalog'] });
  });

  test('removes a source that is already selected', () => {
    const filters: ExerciseLibraryFilters = { sources: ['catalog', 'custom'] };

    expect(toggleSource(filters, 'catalog')).toEqual({ sources: ['custom'] });
  });

  test('deselecting the last source clears the field — an empty selection means both sources', () => {
    const filters: ExerciseLibraryFilters = { sources: ['custom'] };

    expect(toggleSource(filters, 'custom')).toEqual({ sources: undefined });
  });
});

describe('applyButtonLabel', () => {
  test('"No matches" at zero results', () => {
    expect(applyButtonLabel(0)).toBe('No matches');
  });

  test('singular phrasing for exactly one result', () => {
    expect(applyButtonLabel(1)).toBe('Show 1 exercise');
  });

  test('plural phrasing for more than one result', () => {
    expect(applyButtonLabel(12)).toBe('Show 12 exercises');
  });
});

describe('toggleType', () => {
  test('adds a type that is not yet selected, and removes one that is', () => {
    expect(toggleType({}, 'power')).toEqual({ types: ['power'] });
    expect(toggleType({ types: ['power', 'interval'] }, 'power')).toEqual({ types: ['interval'] });
  });

  test('deselecting the last type clears the field — an empty selection means every type', () => {
    expect(toggleType({ types: ['mobility'] }, 'mobility')).toEqual({ types: undefined });
  });
});

describe('FILTER_MUSCLE_GROUPS', () => {
  test('DoD 150: the sheet offers the muscle groups alphabetically', () => {
    expect(FILTER_MUSCLE_GROUPS.map(getMuscleGroupLabel)).toEqual([
      'Abs',
      'Back',
      'Biceps',
      'Calves',
      'Chest',
      'Forearms',
      'Glutes',
      'Hamstrings',
      'Quads',
      'Shoulders',
      'Traps',
      'Triceps',
    ]);
  });

  test('DoD 150: MUSCLE_GROUPS keeps its own order — the exercise list and the cycle summary use it', () => {
    expect(MUSCLE_GROUPS[0]).toBe('chest');
    expect(MUSCLE_GROUPS[MUSCLE_GROUPS.length - 1]).toBe('traps');
    expect([...FILTER_MUSCLE_GROUPS].sort()).toEqual([...MUSCLE_GROUPS].sort());
  });
});
