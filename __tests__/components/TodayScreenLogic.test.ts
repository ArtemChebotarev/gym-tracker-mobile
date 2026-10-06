import { PLAN_MESOCYCLE_LABEL } from '@components/MesocyclesScreenLogic';
import {
  formatInProgressConflict,
  shouldShowWorkoutCoachmarks,
  todayEmptyCopy,
} from '@components/TodayScreenLogic';

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

describe('shouldShowWorkoutCoachmarks', () => {
  const unseen = { welcomeSeen: true, coachmarksSeen: false, deloadIntroSeen: false };
  const live = { mode: 'live' as const, isDeload: false };

  test('DoD: once the Welcome dialog is closed, on a live workout whose tour has not been seen', () => {
    expect(shouldShowWorkoutCoachmarks(unseen, live)).toBe(true);
  });

  test('DoD: never again after it has been seen', () => {
    expect(shouldShowWorkoutCoachmarks({ ...unseen, coachmarksSeen: true }, live)).toBe(false);
  });

  test('not while the Welcome dialog is still up — it comes first', () => {
    expect(shouldShowWorkoutCoachmarks({ ...unseen, welcomeSeen: false }, live)).toBe(false);
  });

  test('not before the flags have been read', () => {
    expect(shouldShowWorkoutCoachmarks(undefined, live)).toBe(false);
  });

  test('not without a session, and not on one that is only read, previewed or a deload', () => {
    expect(shouldShowWorkoutCoachmarks(unseen, undefined)).toBe(false);
    expect(shouldShowWorkoutCoachmarks(unseen, { mode: 'readonly', isDeload: false })).toBe(false);
    expect(shouldShowWorkoutCoachmarks(unseen, { mode: 'preview', isDeload: false })).toBe(false);
    expect(shouldShowWorkoutCoachmarks(unseen, { mode: 'live', isDeload: true })).toBe(false);
  });
});
