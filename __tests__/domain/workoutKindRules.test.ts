import { workoutKindOf } from '@domain/workoutKindRules';

describe('workoutKindOf', () => {
  test('a day of strength exercises only is a strength day', () => {
    expect(workoutKindOf(['strength', 'strength'])).toBe('strength');
  });

  test.each(['power', 'interval', 'mobility'] as const)(
    'one %s exercise makes it hybrid',
    (type) => {
      expect(workoutKindOf(['strength', type])).toBe('hybrid');
    },
  );

  test('a day with nothing done in it is not a hybrid one', () => {
    expect(workoutKindOf([])).toBe('strength');
  });
});
