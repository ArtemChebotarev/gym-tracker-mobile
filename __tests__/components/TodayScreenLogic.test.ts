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

  test.each(['allDone', 'unavailable'] as const)('%s leads to the mesocycles', (reason) => {
    expect(todayEmptyCopy(reason).actionLabel).toBe('Open mesocycles');
  });

  test('says the block is complete once nothing is left', () => {
    expect(todayEmptyCopy('allDone').title).toBe('Block complete');
  });
});
