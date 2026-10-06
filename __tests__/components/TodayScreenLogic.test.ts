import { PLAN_MESOCYCLE_LABEL } from '@components/MesocyclesScreenLogic';
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
    expect(todayEmptyCopy('noActiveMesocycle').actionLabel).toBe(PLAN_MESOCYCLE_LABEL);
  });

  test('with a cycle already planned, points at Cycles instead of inviting to plan another (GT-38)', () => {
    expect(todayEmptyCopy('cyclePlanned')).toMatchObject({
      title: 'Your next cycle is ready',
      description: 'Open Cycles and tap Start to begin.',
      actionLabel: 'Go to Cycles',
    });
  });

  test('a workout that is gone leads to the mesocycles', () => {
    expect(todayEmptyCopy('unavailable').actionLabel).toBe('Open cycles');
  });

  test('says the cycle is complete once nothing is left, and offers to finish it (052)', () => {
    expect(todayEmptyCopy('allDone').title).toBe('Training cycle complete');
    expect(todayEmptyCopy('allDone').actionLabel).toBe('Finish cycle');
  });
});
