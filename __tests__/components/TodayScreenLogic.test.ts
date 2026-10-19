import { PLAN_MESOCYCLE_LABEL } from '@components/MesocyclesScreenLogic';
import {
  formatInProgressConflict,
  shouldShowDeloadIntro,
  shouldShowWorkoutCoachmarks,
  todayEmptyCopy,
  loggedSetKey,
  restAfterLog,
} from '@components/TodayScreenLogic';
import type { PowerWorkoutExercise, WorkoutExercise } from '@usecases/workoutSession';

describe('formatInProgressConflict', () => {
  test('names the session in progress', () => {
    expect(formatInProgressConflict({ weekNumber: 6, dayNumber: 2 })).toBe(
      'Finish Week 6 Day 2 first',
    );
  });
});

describe('todayEmptyCopy', () => {
  test('GT-51: someone who has never had a cycle is invited to start their first, not their next', () => {
    expect(todayEmptyCopy('noActiveMesocycle', false).title).toBe(
      'Start your first training cycle',
    );
    expect(todayEmptyCopy('noActiveMesocycle', true).title).toBe('Start your next training cycle');
    expect(todayEmptyCopy('noActiveMesocycle').title).toBe('Start your next training cycle');
  });

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
  const unseen = {
    welcomeSeen: true,
    coachmarksSeen: false,
    deloadIntroSeen: false,
    startCycleSeen: false,
  };
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

describe('shouldShowDeloadIntro', () => {
  const unseen = {
    welcomeSeen: true,
    coachmarksSeen: true,
    deloadIntroSeen: false,
    startCycleSeen: false,
  };
  const deload = { mode: 'live' as const, isDeload: true };

  test('DoD: on a live deload session whose popup has not been seen', () => {
    expect(shouldShowDeloadIntro(unseen, deload)).toBe(true);
  });

  test('DoD: never again after it has been seen', () => {
    expect(shouldShowDeloadIntro({ ...unseen, deloadIntroSeen: true }, deload)).toBe(false);
  });

  test('not while the Welcome dialog is still up, nor before the flags have been read', () => {
    expect(shouldShowDeloadIntro({ ...unseen, welcomeSeen: false }, deload)).toBe(false);
    expect(shouldShowDeloadIntro(undefined, deload)).toBe(false);
  });

  test('not without a session, and not on a regular or a merely read or previewed one', () => {
    expect(shouldShowDeloadIntro(unseen, undefined)).toBe(false);
    expect(shouldShowDeloadIntro(unseen, { mode: 'live', isDeload: false })).toBe(false);
    expect(shouldShowDeloadIntro(unseen, { mode: 'readonly', isDeload: true })).toBe(false);
    expect(shouldShowDeloadIntro(unseen, { mode: 'preview', isDeload: true })).toBe(false);
  });
});

describe('restAfterLog', () => {
  function card(id: string, restSec: number | undefined, logged: number[]): PowerWorkoutExercise {
    return {
      sessionExerciseId: id,
      exerciseId: id,
      name: id,
      muscleGroup: 'fullBody',
      status: 'planned',
      type: 'power',
      powerLoad: 'weight',
      rows: [1, 2, 3].map((setNumber) =>
        logged.includes(setNumber)
          ? { setNumber, isFirstUnlogged: false, log: { weight: 6, reps: 5 } }
          : { setNumber, isFirstUnlogged: setNumber === logged.length + 1 },
      ),
      plannedSetCount: 3,
      loggedSetCount: logged.length,
      hasLoggedSets: logged.length > 0,
      actions: {
        canReplace: true,
        canAddSet: true,
        canRemoveLastSet: true,
        canMoveUp: false,
        canMoveDown: false,
        canSkip: true,
        canUnskip: false,
        canDelete: true,
      },
      ...(restSec === undefined ? {} : { restSec }),
    };
  }
  const NONE = new Set<string>();

  test('starts the rest before the next set still to do', () => {
    const a = card('a', 60, []);
    expect(restAfterLog([a], a, 1, NONE)).toEqual({
      kind: 'start',
      rest: {
        sessionExerciseId: 'a',
        next: { kind: 'set', setNumber: 2 },
        durationSec: 60,
      },
    });
  });

  test('after the last set of the workout the rest is over', () => {
    const a = card('a', 60, [1, 2]);
    expect(restAfterLog([a], a, 3, NONE)).toEqual({ kind: 'stop' });
  });

  test('after an exercise’s last set the rest is before the next exercise (19.10.2026)', () => {
    const a = card('a', 60, [1, 2]);
    const b = card('b', 90, []);
    expect(restAfterLog([a, b], a, 3, NONE)).toEqual({
      kind: 'start',
      rest: { sessionExerciseId: 'a', next: { kind: 'exercise', name: 'b' }, durationSec: 60 },
    });
  });

  test('the next exercise is the first below with work left, else the first above', () => {
    const a = card('a', 60, []);
    const c = card('c', 60, [1, 2, 3]);
    const b = card('b', 60, [1, 2]);
    // b is last on the list and c, above it, is done: the work left is a, at the top.
    expect(restAfterLog([a, c, b], b, 3, NONE)).toMatchObject({
      kind: 'start',
      rest: { next: { kind: 'exercise', name: 'a' } },
    });
  });

  test('a skipped exercise has nothing left, and an interval with rounds to do has', () => {
    const a = card('a', 60, [1, 2]);
    const skipped: WorkoutExercise = {
      ...card('skipped', 60, []),
      status: 'skipped',
      rows: [1, 2, 3].map((setNumber) => ({
        setNumber,
        isFirstUnlogged: false,
        notDone: 'skipped' as const,
      })),
    };
    expect(restAfterLog([a, skipped], a, 3, NONE)).toEqual({ kind: 'stop' });

    const bag: WorkoutExercise = {
      sessionExerciseId: 'bag',
      exerciseId: 'bag',
      name: 'Heavy bag',
      muscleGroup: 'fullBody',
      type: 'interval',
      status: 'planned',
      rounds: [{ roundNumber: 1, workSec: 120, restSec: 45, isFirstUnlogged: true }],
      plannedRoundCount: 1,
      loggedRoundCount: 0,
      hasLoggedSets: false,
      actions: skipped.actions,
    };
    expect(restAfterLog([a, skipped, bag], a, 3, NONE)).toMatchObject({
      kind: 'start',
      rest: { next: { kind: 'exercise', name: 'Heavy bag' } },
    });
  });

  test('an exercise without a rest ends any rest left', () => {
    const a = card('a', undefined, []);
    expect(restAfterLog([a], a, 1, NONE)).toEqual({ kind: 'stop' });
  });

  test('a log above an exercise already started is a correction: the rest carries on', () => {
    const a = card('a', 60, [1]);
    const b = card('b', 60, [1]);
    expect(restAfterLog([a, b], a, 1, NONE)).toEqual({ kind: 'keep' });
    expect(restAfterLog([a, b], a, 2, NONE)).toEqual({ kind: 'keep' });
  });

  test('an exercise below that is not started yet does not hold the rest back', () => {
    const a = card('a', 60, []);
    const b = card('b', 60, []);
    expect(restAfterLog([a, b], a, 1, NONE).kind).toBe('start');
  });

  test('a set logged again in the same workout is a correction', () => {
    const a = card('a', 60, []);
    expect(restAfterLog([a], a, 1, new Set([loggedSetKey('a', 1)]))).toEqual({ kind: 'keep' });
  });
});
