import { formatInProgressConflict, todayEmptyCopy } from '@components/TodayScreenLogic';

describe('formatInProgressConflict', () => {
  test('names the session in progress', () => {
    expect(formatInProgressConflict({ weekNumber: 6, dayNumber: 2 })).toBe(
      'Finish Week 6 Day 2 first',
    );
  });
});

describe('todayEmptyCopy', () => {
  test('invites creating a mesocycle when none is active', () => {
    expect(todayEmptyCopy('noActiveMesocycle').actionLabel).toBe('Create mesocycle');
  });

  test('a workout that is gone leads to the mesocycles', () => {
    expect(todayEmptyCopy('unavailable').actionLabel).toBe('Open mesocycles');
  });

  test('says the block is complete once nothing is left, and offers to finish it (052)', () => {
    expect(todayEmptyCopy('allDone').title).toBe('Block complete');
    expect(todayEmptyCopy('allDone').actionLabel).toBe('Finish mesocycle');
  });
});
