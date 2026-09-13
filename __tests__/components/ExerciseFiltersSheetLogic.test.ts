import { getCategoryColor, getCategoryTextOnTint, getCategoryTint } from '@design/muscleGroupColor';

import type { ExerciseLibraryFilters } from '@components/ExerciseLibraryScreen';
import {
  applyButtonLabel,
  muscleGroupChipColors,
  toggleMuscleGroup,
  toggleSource,
} from '@components/ExerciseFiltersSheetLogic';

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

describe('muscleGroupChipColors', () => {
  test('resolves the dot and border to the raw category color, for a known muscle group', () => {
    expect(muscleGroupChipColors('chest').dot).toBe(getCategoryColor('chest'));
    expect(muscleGroupChipColors('chest').border).toBe(getCategoryColor('chest'));
  });

  test('resolves the tint and text colors from the same category', () => {
    expect(muscleGroupChipColors('back').tint).toBe(getCategoryTint('back'));
    expect(muscleGroupChipColors('back').text).toBe(getCategoryTextOnTint('back'));
  });

  test('groups sharing a family resolve to the same colors (traps shares "back" with back)', () => {
    expect(muscleGroupChipColors('traps')).toEqual(muscleGroupChipColors('back'));
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
