import {
  EXERCISE_OVERVIEW_MENU_ACTIONS,
  exerciseOverviewMenuActions,
  formatHideExerciseWarning,
} from '@components/ExerciseMenuLogic';

describe('exerciseOverviewMenuActions', () => {
  test('a catalog exercise offers Hide and nothing else', () => {
    const items = exerciseOverviewMenuActions(['hide'], jest.fn());

    expect(items.map((item) => item.label)).toEqual(['Hide']);
  });

  test('a custom exercise offers Edit as well, in the order the domain gives', () => {
    const items = exerciseOverviewMenuActions(['edit', 'hide'], jest.fn());

    expect(items.map((item) => item.label)).toEqual(['Edit', 'Hide']);
  });

  test('each item calls back with its own action', () => {
    const onAction = jest.fn();
    const items = exerciseOverviewMenuActions(['edit', 'hide'], onAction);

    items.find((item) => item.key === 'hide')?.onPress();

    expect(onAction).toHaveBeenCalledWith('hide');
  });

  test('nothing is marked destructive — Hide throws nothing away (08.6)', () => {
    const items = exerciseOverviewMenuActions(['edit', 'hide'], jest.fn());

    expect(items.every((item) => item.destructive === undefined)).toBe(true);
  });
});

describe('EXERCISE_OVERVIEW_MENU_ACTIONS', () => {
  test('there is never a Delete action (08.6: "Удаления в интерфейсе нет вообще")', () => {
    expect(Object.keys(EXERCISE_OVERVIEW_MENU_ACTIONS)).toEqual(['edit', 'hide']);
  });

  test('every action names both icons — the sheet draws one, the native menu the other', () => {
    for (const action of Object.values(EXERCISE_OVERVIEW_MENU_ACTIONS)) {
      expect(typeof action.icon).toBe('function');
      expect(action.systemImage).toMatch(/\S/);
    }
  });
});

describe('formatHideExerciseWarning', () => {
  test('names the exercise and promises the history stays', () => {
    const message = formatHideExerciseWarning('Bench Press');

    expect(message).toContain('Bench Press');
    expect(message).toContain('stays in your history');
  });
});
