import {
  EXERCISE_MENU_ACTIONS,
  exerciseMenuRows,
  formatDeleteExerciseWarning,
  formatExerciseMenuSubtitle,
  formatReplaceExerciseWarning,
} from '@components/WorkoutExerciseMenuSheetLogic';
import type { WorkoutExerciseActions } from '@usecases/workoutSession';

// A live, planned exercise in the middle of the list with several rows: everything available.
const ALL: WorkoutExerciseActions = {
  canReplace: true,
  canAddSet: true,
  canRemoveLastSet: true,
  canMoveUp: true,
  canMoveDown: true,
  canSkip: true,
  canUnskip: false,
  canDelete: true,
};

describe('exerciseMenuRows', () => {
  test('lists every action in the 08.7 order, all available', () => {
    expect(exerciseMenuRows(ALL)).toEqual([
      { item: 'replace' },
      { item: 'addSet' },
      { item: 'removeLastSet' },
      { item: 'moveUp' },
      { item: 'moveDown' },
      { item: 'skip' },
      { item: 'delete' },
    ]);
  });

  test('keeps what is not available listed, disabled with the reason', () => {
    const rows = exerciseMenuRows({
      ...ALL,
      canRemoveLastSet: false,
      canMoveUp: false,
      canMoveDown: false,
    });

    expect(rows.filter((row) => row.disabledReason !== undefined)).toEqual([
      { item: 'removeLastSet', disabledReason: 'Only one set' },
      { item: 'moveUp', disabledReason: 'Already first' },
      { item: 'moveDown', disabledReason: 'Already last' },
    ]);
  });

  test('a skipped exercise gets Unskip in place of Skip', () => {
    const items = exerciseMenuRows({ ...ALL, canSkip: false, canUnskip: true }).map(
      (row) => row.item,
    );

    expect(items).toContain('unskip');
    expect(items).not.toContain('skip');
    expect(items.indexOf('unskip')).toBe(5);
  });
});

describe('EXERCISE_MENU_ACTIONS', () => {
  test('only Delete exercise is a danger action', () => {
    const danger = Object.entries(EXERCISE_MENU_ACTIONS)
      .filter(([, action]) => action.variant === 'danger')
      .map(([item]) => item);
    expect(danger).toEqual(['delete']);
  });
});

describe('formatExerciseMenuSubtitle', () => {
  test('counts the planned and logged sets', () => {
    expect(formatExerciseMenuSubtitle(2, 1)).toBe('2 sets planned · 1 logged');
    expect(formatExerciseMenuSubtitle(1, 0)).toBe('1 set planned · 0 logged');
  });
});

describe('formatDeleteExerciseWarning', () => {
  test('with nothing logged, only says it leaves next week', () => {
    expect(formatDeleteExerciseWarning(0)).toBe("It won't carry over to next week.");
  });

  test('warns that logged sets are deleted too', () => {
    expect(formatDeleteExerciseWarning(1)).toBe(
      "Its 1 set logged will be deleted too. It won't carry over to next week.",
    );
    expect(formatDeleteExerciseWarning(2)).toBe(
      "Its 2 sets logged will be deleted too. It won't carry over to next week.",
    );
  });
});

describe('formatReplaceExerciseWarning', () => {
  test('names the exercise and how many logged sets go', () => {
    expect(formatReplaceExerciseWarning('Bench Press', 2)).toBe(
      'The 2 sets logged for Bench Press will be deleted.',
    );
  });
});
