import { PLAN_MESOCYCLE_LABEL } from '@components/MesocyclesScreenLogic';
import {
  formatInProgressConflict,
  intervalTimerStartOf,
  restAfterIntervalBlock,
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
      getReadySec: 5,
      actions: { ...skipped.actions, canAddRound: true, canRemoveLastRound: false },
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

  test('a round logged by hand rests for its own rest before the next round (GT-89)', () => {
    const bag: WorkoutExercise = {
      sessionExerciseId: 'bag',
      exerciseId: 'bag',
      name: 'Heavy bag',
      muscleGroup: 'fullBody',
      type: 'interval',
      status: 'planned',
      rounds: [
        { roundNumber: 1, workSec: 120, restSec: 45, isFirstUnlogged: true },
        { roundNumber: 2, workSec: 120, restSec: 30, isFirstUnlogged: false },
      ],
      plannedRoundCount: 2,
      loggedRoundCount: 0,
      hasLoggedSets: false,
      getReadySec: 5,
      actions: { ...card('x', 60, []).actions, canAddRound: true, canRemoveLastRound: true },
    };
    const after = card('after', 60, []);

    expect(restAfterLog([bag, after], bag, 1, NONE)).toEqual({
      kind: 'start',
      rest: { sessionExerciseId: 'bag', next: { kind: 'round', roundNumber: 2 }, durationSec: 45 },
    });
    // The last round: its own rest, before the next exercise.
    const lastLeft: WorkoutExercise = {
      ...bag,
      rounds: [
        {
          ...bag.rounds[0]!,
          isFirstUnlogged: false,
          log: { workSec: 120, restSkipped: false, completed: true },
        },
        { ...bag.rounds[1]!, isFirstUnlogged: true },
      ],
    };
    expect(restAfterLog([lastLeft, after], lastLeft, 2, NONE)).toEqual({
      kind: 'start',
      rest: {
        sessionExerciseId: 'bag',
        next: { kind: 'exercise', name: 'after' },
        durationSec: 30,
      },
    });
    // A rest picked in the workout is the one it rests for, not the plan's (GT-90).
    expect(restAfterLog([bag, after], bag, 1, NONE, 60)).toMatchObject({
      kind: 'start',
      rest: { durationSec: 60 },
    });
    // A round with no rest ends any rest left.
    const noRest: WorkoutExercise = {
      ...bag,
      rounds: [{ roundNumber: 1, workSec: 120, isFirstUnlogged: true }, bag.rounds[1]!],
    };
    expect(restAfterLog([noRest, after], noRest, 1, NONE)).toEqual({ kind: 'stop' });
  });

  test('a set logged again in the same workout is a correction', () => {
    const a = card('a', 60, []);
    expect(restAfterLog([a], a, 1, new Set([loggedSetKey('a', 1)]))).toEqual({ kind: 'keep' });
  });
});

describe('intervalTimerStartOf', () => {
  const bag: WorkoutExercise = {
    sessionExerciseId: 'bag',
    exerciseId: 'heavy-bag',
    name: 'Heavy bag',
    muscleGroup: 'fullBody',
    type: 'interval',
    status: 'planned',
    rounds: [
      {
        roundNumber: 1,
        workSec: 120,
        restSec: 45,
        isFirstUnlogged: false,
        log: { workSec: 120, restSec: 45, restSkipped: false, completed: true },
      },
      { roundNumber: 2, workSec: 120, restSec: 45, isFirstUnlogged: true },
    ],
    plannedRoundCount: 2,
    loggedRoundCount: 1,
    hasLoggedSets: true,
    getReadySec: 10,
    actions: {
      canReplace: false,
      canMoveUp: false,
      canMoveDown: false,
      canSkip: false,
      canUnskip: false,
      canDelete: false,
      canAddRound: true,
      canRemoveLastRound: true,
    },
  };
  const rounds = [{ roundNumber: 2, workSec: 120, restSec: 45 }];

  test('an interval card: the exercise as the timer names it, its rounds and its Get ready', () => {
    expect(intervalTimerStartOf('session', bag, rounds)).toEqual({
      exercise: {
        sessionId: 'session',
        sessionExerciseId: 'bag',
        name: 'Heavy bag',
        totalRounds: 2,
        loggedRoundNumbers: [1],
      },
      rounds,
      getReadySec: 10,
    });
  });

  test('nothing for a round-less start', () => {
    expect(intervalTimerStartOf('session', bag, [])).toBeUndefined();
  });

  test('a mobility card: its one block, marked so the timer speaks of the block (GT-107)', () => {
    const cooldown: WorkoutExercise = {
      sessionExerciseId: 'cooldown',
      exerciseId: 'cooldown',
      name: 'Cooldown',
      muscleGroup: 'fullBody',
      type: 'mobility',
      status: 'planned',
      rounds: [{ roundNumber: 1, workSec: 600, isFirstUnlogged: true }],
      plannedRoundCount: 1,
      loggedRoundCount: 0,
      hasLoggedSets: false,
      getReadySec: 5,
      actions: bag.actions,
    };
    const block = [{ roundNumber: 1, workSec: 600, restSec: 0 }];
    expect(intervalTimerStartOf('session', cooldown, block)).toEqual({
      exercise: {
        type: 'mobility',
        sessionId: 'session',
        sessionExerciseId: 'cooldown',
        name: 'Cooldown',
        totalRounds: 1,
        loggedRoundNumbers: [],
      },
      rounds: block,
      getReadySec: 5,
    });
  });
});

describe('restAfterIntervalBlock (GT-98)', () => {
  const bag: WorkoutExercise = {
    sessionExerciseId: 'bag',
    exerciseId: 'heavy-bag',
    name: 'Heavy bag',
    muscleGroup: 'fullBody',
    type: 'interval',
    status: 'planned',
    rounds: [1, 2].map((roundNumber) => ({
      roundNumber,
      workSec: 120,
      restSec: 45,
      isFirstUnlogged: false,
      log: { workSec: 120, restSec: 45, restSkipped: false, completed: true },
    })),
    plannedRoundCount: 2,
    loggedRoundCount: 2,
    hasLoggedSets: true,
    getReadySec: 5,
    actions: {
      canReplace: false,
      canMoveUp: false,
      canMoveDown: false,
      canSkip: false,
      canUnskip: false,
      canDelete: false,
      canAddRound: true,
      canRemoveLastRound: true,
    },
  };
  const cooldown: WorkoutExercise = {
    ...bag,
    sessionExerciseId: 'cooldown',
    name: 'Cooldown',
    rounds: [{ roundNumber: 1, workSec: 600, isFirstUnlogged: true }],
    loggedRoundCount: 0,
    hasLoggedSets: false,
  };

  test('the rest before the next exercise with work left, for the rest the last round was logged with', () => {
    expect(
      restAfterIntervalBlock([bag, cooldown], {
        sessionExerciseId: 'bag',
        roundNumber: 2,
        restSec: 5,
      }),
    ).toEqual({
      kind: 'start',
      rest: {
        sessionExerciseId: 'bag',
        next: { kind: 'exercise', name: 'Cooldown' },
        durationSec: 5,
      },
    });
  });

  test('none when the workout has nothing left', () => {
    expect(
      restAfterIntervalBlock([bag], { sessionExerciseId: 'bag', roundNumber: 2, restSec: 45 }),
    ).toEqual({ kind: 'stop' });
  });

  test('nothing to act on when the exercise is gone from the workout', () => {
    expect(
      restAfterIntervalBlock([cooldown], { sessionExerciseId: 'bag', roundNumber: 2, restSec: 45 }),
    ).toBeUndefined();
  });
});
