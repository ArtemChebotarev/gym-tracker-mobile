import {
  EXERCISE_MENU_ACTIONS,
  exerciseMenuRows,
  formatDeleteExerciseWarning,
  formatExerciseMenuSubtitle,
  formatReplaceExerciseWarning,
  formatSkipExerciseWarning,
  workoutExerciseMenuActions,
} from '@components/WorkoutExerciseMenuLogic';
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
  test('only Delete exercise is destructive', () => {
    const destructive = Object.entries(EXERCISE_MENU_ACTIONS)
      .filter(([, action]) => action.destructive === true)
      .map(([item]) => item);
    expect(destructive).toEqual(['delete']);
  });

  test('every action names both icons — the sheet draws one, the native menu the other', () => {
    for (const action of Object.values(EXERCISE_MENU_ACTIONS)) {
      expect(typeof action.icon).toBe('function');
      expect(action.systemImage).toMatch(/\S/);
    }
  });
});

describe('workoutExerciseMenuActions', () => {
  test('keeps an unavailable action listed, disabled with its reason', () => {
    const onAction = jest.fn();
    const items = workoutExerciseMenuActions(
      { ...ALL, canMoveUp: false, canRemoveLastSet: false },
      onAction,
    );

    const moveUp = items.find((item) => item.key === 'moveUp');
    expect(moveUp?.disabledReason).toBe('Already first');
    expect(items.find((item) => item.key === 'removeLastSet')?.disabledReason).toBe('Only one set');
    // An available one carries no reason at all.
    expect(items.find((item) => item.key === 'addSet')?.disabledReason).toBeUndefined();
  });

  test('each item calls back with its own action', () => {
    const onAction = jest.fn();
    const items = workoutExerciseMenuActions(ALL, onAction);

    items.find((item) => item.key === 'delete')?.onPress();

    expect(onAction).toHaveBeenCalledWith('delete');
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

describe('formatSkipExerciseWarning', () => {
  test('with nothing logged, every set is skipped', () => {
    expect(formatSkipExerciseWarning(3, 0)).toBe('All 3 sets will be skipped.');
  });

  test('with some sets logged, those stay and the rest are skipped', () => {
    expect(formatSkipExerciseWarning(3, 2)).toBe(
      'Its 2 sets logged will stay; 1 set not logged will be skipped.',
    );
  });

  test('with every set logged, nothing is lost', () => {
    expect(formatSkipExerciseWarning(2, 2)).toBe('All 2 sets are logged and will stay.');
  });
});

describe('formatReplaceExerciseWarning', () => {
  test('names the exercise and how many logged sets go', () => {
    expect(formatReplaceExerciseWarning('Bench Press', 2)).toBe(
      'The 2 sets logged for Bench Press will be deleted.',
    );
  });
});
