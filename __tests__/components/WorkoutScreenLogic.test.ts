import { formatUnlocksCaption, formatWorkoutSubtitle } from '@components/WorkoutScreenLogic';

describe('formatWorkoutSubtitle', () => {
  test('shows the date, then the mesocycle name', () => {
    // Local noon, so the calendar day doesn't depend on the test machine's time zone.
    const date = new Date(2026, 8, 15, 12).toISOString();

    expect(formatWorkoutSubtitle({ date, mesocycleName: 'Upper/lower' })).toBe(
      'Tue, 15 Sep · Upper/lower',
    );
  });

  test('shows only the mesocycle name for a session without a date', () => {
    expect(formatWorkoutSubtitle({ mesocycleName: 'Upper/lower' })).toBe('Upper/lower');
  });
});

describe('formatUnlocksCaption', () => {
  test('names the session whose Finish programs the day', () => {
    expect(formatUnlocksCaption({ weekNumber: 6, dayNumber: 3 })).toBe(
      'Unlocks when you finish Week 6 Day 3',
    );
  });
});
