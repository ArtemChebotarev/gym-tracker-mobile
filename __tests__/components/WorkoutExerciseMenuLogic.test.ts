import {
  EXERCISE_MENU_ACTIONS,
  exerciseMenuRows,
  exerciseLogCounts,
  formatDeleteExerciseWarning,
  formatExerciseMenuSubtitle,
  formatReplaceExerciseWarning,
  formatSkipExerciseWarning,
  setMenuRows,
  typeMenuRows,
  workoutExerciseMenuActions,
} from '@components/WorkoutExerciseMenuLogic';
import type {
  IntervalWorkoutExercise,
  SetExerciseActions,
  StrengthWorkoutExercise,
} from '@usecases/workoutSession';

// A live, planned exercise in the middle of the list with several rows: everything available.
const ALL: SetExerciseActions = {
  canReplace: true,
  canAddSet: true,
  canRemoveLastSet: true,
  canMoveUp: true,
  canMoveDown: true,
  canSkip: true,
  canUnskip: false,
  canDelete: true,
};

function strengthCard(actions: SetExerciseActions = ALL): StrengthWorkoutExercise {
  return {
    sessionExerciseId: 'se-1',
    exerciseId: 'bench',
    name: 'Bench press',
    muscleGroup: 'chest',
    status: 'planned',
    rows: [],
    plannedSetCount: 3,
    loggedSetCount: 1,
    hasLoggedSets: true,
    actions,
  };
}

function intervalCard(): IntervalWorkoutExercise {
  return {
    sessionExerciseId: 'se-2',
    exerciseId: 'heavy-bag',
    name: 'Heavy bag',
    muscleGroup: 'fullBody',
    type: 'interval',
    status: 'planned',
    rounds: [],
    plannedRoundCount: 3,
    loggedRoundCount: 1,
    hasLoggedSets: true,
    actions: ALL,
  };
}

describe('exerciseMenuRows', () => {
  test('lists every action in the 08.7 order, all available', () => {
    expect(exerciseMenuRows(ALL, setMenuRows(ALL))).toEqual([
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
    const actions = { ...ALL, canRemoveLastSet: false, canMoveUp: false, canMoveDown: false };
    const rows = exerciseMenuRows(actions, setMenuRows(actions));

    expect(rows.filter((row) => row.disabledReason !== undefined)).toEqual([
      { item: 'removeLastSet', disabledReason: 'Only one set' },
      { item: 'moveUp', disabledReason: 'Already first' },
      { item: 'moveDown', disabledReason: 'Already last' },
    ]);
  });

  test('a skipped exercise gets Unskip in place of Skip', () => {
    const actions = { ...ALL, canSkip: false, canUnskip: true };
    const items = exerciseMenuRows(actions, setMenuRows(actions)).map((row) => row.item);

    expect(items).toContain('unskip');
    expect(items).not.toContain('skip');
    expect(items.indexOf('unskip')).toBe(5);
  });

  test('the type’s own rows go right after Replace', () => {
    expect(exerciseMenuRows(ALL, []).map((row) => row.item)).toEqual([
      'replace',
      'moveUp',
      'moveDown',
      'skip',
      'delete',
    ]);
  });
});

describe('typeMenuRows', () => {
  test('a card of set rows offers Add set and Remove last set', () => {
    expect(typeMenuRows(strengthCard())).toEqual(setMenuRows(ALL));
  });

  test('an interval card has none of its own yet — its round rows come with GT-91', () => {
    expect(typeMenuRows(intervalCard())).toEqual([]);
  });
});

describe('exerciseLogCounts', () => {
  test('a card of set rows counts sets, an interval card rounds', () => {
    expect(exerciseLogCounts(strengthCard())).toEqual({ unit: 'set', planned: 3, logged: 1 });
    expect(exerciseLogCounts(intervalCard())).toEqual({ unit: 'round', planned: 3, logged: 1 });
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
      strengthCard({ ...ALL, canMoveUp: false, canRemoveLastSet: false }),
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
    const items = workoutExerciseMenuActions(strengthCard(), onAction);

    items.find((item) => item.key === 'delete')?.onPress();

    expect(onAction).toHaveBeenCalledWith('delete');
  });
});

describe('formatExerciseMenuSubtitle', () => {
  test('counts the planned and logged sets', () => {
    expect(formatExerciseMenuSubtitle({ unit: 'set', planned: 2, logged: 1 })).toBe(
      '2 sets planned · 1 logged',
    );
    expect(formatExerciseMenuSubtitle({ unit: 'set', planned: 1, logged: 0 })).toBe(
      '1 set planned · 0 logged',
    );
  });

  test('an interval card counts rounds', () => {
    expect(formatExerciseMenuSubtitle({ unit: 'round', planned: 3, logged: 1 })).toBe(
      '3 rounds planned · 1 logged',
    );
  });
});

describe('formatDeleteExerciseWarning', () => {
  test('names how many logged sets go with the exercise', () => {
    expect(formatDeleteExerciseWarning({ unit: 'set', planned: 3, logged: 1 })).toBe(
      'Delete exercise with 1 logged set?',
    );
    expect(formatDeleteExerciseWarning({ unit: 'round', planned: 3, logged: 2 })).toBe(
      'Delete exercise with 2 logged rounds?',
    );
  });
});

describe('formatSkipExerciseWarning', () => {
  test('names how many sets are still unlogged', () => {
    expect(formatSkipExerciseWarning({ unit: 'set', planned: 3, logged: 0 })).toBe(
      'Skip the exercise with 3 unlogged sets?',
    );
    expect(formatSkipExerciseWarning({ unit: 'set', planned: 3, logged: 2 })).toBe(
      'Skip the exercise with 1 unlogged set?',
    );
  });
});

describe('formatReplaceExerciseWarning', () => {
  test('names the exercise and how many logged sets go', () => {
    expect(
      formatReplaceExerciseWarning('Bench Press', { unit: 'set', planned: 3, logged: 2 }),
    ).toBe('The 2 sets logged for Bench Press will be deleted.');
  });
});
