import {
  bestSet,
  buildFinishSummary,
  finishSummaryInput,
  formatUpNext,
  type FinishSummaryInput,
} from '@components/FinishDialogLogic';
import type { Session, SessionExercise, SetTarget } from '@domain/execution';
import type { MesoGrid } from '@domain/mesoGrid';
import type { SessionFinishResult } from '@usecases/sessionFinish';
import type {
  IntervalWorkoutExercise,
  MobilityWorkoutExercise,
  PowerWorkoutExercise,
  StrengthWorkoutExercise,
  WorkoutExercise,
  WorkoutRoundRow,
  WorkoutSessionModel,
  WorkoutSetRow,
} from '@usecases/workoutSession';

const ACTIONS = {
  canReplace: false,
  canMoveUp: false,
  canMoveDown: false,
  canSkip: false,
  canUnskip: false,
  canDelete: false,
};
const SET_ACTIONS = { ...ACTIONS, canAddSet: false, canRemoveLastSet: false };
const ROUND_ACTIONS = { ...ACTIONS, canAddRound: false, canRemoveLastRound: false };
const STAMPS = { createdAt: '2026-11-04T10:00:00.000Z', updatedAt: '2026-11-04T10:00:00.000Z' };

function setRows(logs: ({ weight: number; reps: number } | undefined)[]): WorkoutSetRow[] {
  return logs.map((log, index) => ({
    setNumber: index + 1,
    isFirstUnlogged: false,
    ...(log === undefined ? {} : { log }),
  }));
}

function strength(
  id: string,
  logs: ({ weight: number; reps: number } | undefined)[],
  extra: Partial<StrengthWorkoutExercise> = {},
): StrengthWorkoutExercise {
  const rows = setRows(logs);
  return {
    sessionExerciseId: `se-${id}`,
    exerciseId: id,
    name: id,
    muscleGroup: 'chest',
    status: rows.some((row) => row.log !== undefined) ? 'completed' : 'skipped',
    type: 'strength',
    rows,
    plannedSetCount: rows.length,
    loggedSetCount: rows.filter((row) => row.log !== undefined).length,
    hasLoggedSets: rows.some((row) => row.log !== undefined),
    actions: SET_ACTIONS,
    ...extra,
  };
}

function power(
  id: string,
  powerLoad: PowerWorkoutExercise['powerLoad'],
  logs: { weight: number; reps: number }[],
): PowerWorkoutExercise {
  const rows = setRows(logs);
  return {
    sessionExerciseId: `se-${id}`,
    exerciseId: id,
    name: id,
    muscleGroup: 'fullBody',
    status: 'completed',
    type: 'power',
    powerLoad,
    rows,
    plannedSetCount: rows.length,
    loggedSetCount: rows.length,
    hasLoggedSets: true,
    actions: SET_ACTIONS,
  };
}

function roundRows(
  done: { workSec: number; restSec: number }[],
  planned = done.length,
): WorkoutRoundRow[] {
  return Array.from({ length: planned }, (_, index) => {
    const log = done[index];
    return {
      roundNumber: index + 1,
      workSec: 40,
      restSec: 20,
      isFirstUnlogged: false,
      ...(log === undefined ? {} : { log: { ...log, restSkipped: false, completed: true } }),
    };
  });
}

function interval(
  id: string,
  done: { workSec: number; restSec: number }[],
  planned?: number,
): IntervalWorkoutExercise {
  const rounds = roundRows(done, planned);
  return {
    sessionExerciseId: `se-${id}`,
    exerciseId: id,
    name: id,
    muscleGroup: 'fullBody',
    status: done.length > 0 ? 'completed' : 'skipped',
    type: 'interval',
    rounds,
    plannedRoundCount: rounds.length,
    loggedRoundCount: done.length,
    hasLoggedSets: done.length > 0,
    getReadySec: 10,
    actions: ROUND_ACTIONS,
  };
}

function mobility(
  id: string,
  done: { workSec: number; restSec: number }[],
): MobilityWorkoutExercise {
  const rounds = roundRows(done);
  return {
    sessionExerciseId: `se-${id}`,
    exerciseId: id,
    name: id,
    muscleGroup: 'fullBody',
    status: 'completed',
    type: 'mobility',
    rounds,
    plannedRoundCount: rounds.length,
    loggedRoundCount: done.length,
    hasLoggedSets: true,
    getReadySec: 10,
    actions: ROUND_ACTIONS,
  };
}

function nextExercise(exerciseId: string, setTargets: SetTarget[], order = 1): SessionExercise {
  return {
    ...STAMPS,
    id: `next-${exerciseId}-${order}`,
    sessionId: 'next',
    exerciseId,
    order,
    setTargets,
    targetRir: 2,
    status: 'planned',
  };
}

function input(
  exercises: WorkoutExercise[],
  next: SessionExercise[] | null,
  extra: Partial<FinishSummaryInput> = {},
): FinishSummaryInput {
  return {
    exercises,
    weekNumber: 2,
    dayNumber: 1,
    status: 'completed',
    next: next === null ? null : { isDeload: false, exercises: next },
    upNext: { weekNumber: 2, dayNumber: 2 },
    ...extra,
  };
}

function rowsOf(summary: ReturnType<typeof buildFinishSummary>) {
  if (summary.kind !== 'day') {
    throw new Error('Expected a day summary.');
  }
  return summary.rows.map(({ name, value, delta }) => ({ name, value, delta }));
}

describe('buildFinishSummary — a day', () => {
  test('GT-220: the title, the count of exercises and sets, the lead and Up next', () => {
    const bench = strength('Bench Press', [
      { weight: 80, reps: 10 },
      { weight: 80, reps: 9 },
    ]);
    const summary = buildFinishSummary(
      input(
        [bench],
        [
          nextExercise('Bench Press', [
            { setNumber: 1, targetReps: 11 },
            { setNumber: 2, targetReps: 10 },
          ]),
        ],
      ),
    );

    expect(summary).toMatchObject({
      kind: 'day',
      title: 'Day 1 done',
      subtitle: '1 exercise · 2 sets',
      lead: [{ strong: 'Progression added' }, " to next week's Day 1."],
      upNext: 'Day 2',
      action: 'nextWorkout',
      buttonLabel: 'Next workout',
    });
    expect(rowsOf(summary)).toEqual([
      { name: 'Bench Press', value: '80 kg × 10', delta: '+1 rep' },
    ]);
  });

  test('strength: a weight hint reads Go heavier or Go lighter, before any rep change', () => {
    const press = strength('Leg Press', [{ weight: 100, reps: 30 }]);
    const row = strength('Row', [{ weight: 60, reps: 6 }]);
    const summary = buildFinishSummary(
      input(
        [press, row],
        [
          nextExercise('Leg Press', [{ setNumber: 1, targetReps: 31, weightHint: 'increase' }], 1),
          nextExercise('Row', [{ setNumber: 1, targetReps: 7, weightHint: 'decrease' }], 2),
        ],
      ),
    );

    expect(rowsOf(summary).map((r) => r.delta)).toEqual(['Go heavier', 'Go lighter']);
  });

  test('strength: a heavier suggested weight reads Go heavier; several reps more read in the plural', () => {
    const squat = strength('Squat', [{ weight: 100, reps: 8 }]);
    const curl = strength('Curl', [{ weight: 14, reps: 10 }]);
    const summary = buildFinishSummary(
      input(
        [squat, curl],
        [
          nextExercise('Squat', [{ setNumber: 1, targetReps: 6, suggestedWeight: 105 }], 1),
          nextExercise('Curl', [{ setNumber: 1, targetReps: 12, suggestedWeight: 14 }], 2),
        ],
      ),
    );

    expect(rowsOf(summary).map((r) => r.delta)).toEqual(['Go heavier', '+2 reps']);
  });

  test('a day that repeats as it was says no progression: no lead, an empty right column', () => {
    const bench = strength('Bench Press', [{ weight: 80, reps: 10 }]);
    const summary = buildFinishSummary(
      input([bench], [nextExercise('Bench Press', [{ setNumber: 1, targetReps: 10 }])]),
    );

    expect(summary).toMatchObject({ kind: 'day', lead: undefined });
    expect(rowsOf(summary)[0]?.delta).toBeUndefined();
  });

  test('an estimate is no target: nothing on the right', () => {
    const bench = strength('Bench Press', [{ weight: 80, reps: 10 }]);
    const summary = buildFinishSummary(
      input(
        [bench],
        [nextExercise('Bench Press', [{ setNumber: 1, targetReps: 12, estimate: 'other_slot' }])],
      ),
    );

    expect(rowsOf(summary)[0]?.delta).toBeUndefined();
  });

  test('the best set is the heaviest, then the one with the most reps', () => {
    expect(
      bestSet(
        setRows([
          { weight: 60, reps: 12 },
          { weight: 70, reps: 6 },
          { weight: 70, reps: 8 },
        ]),
      )?.log,
    ).toEqual({ weight: 70, reps: 8 });
    expect(bestSet(setRows([undefined, undefined]))).toBeUndefined();
  });

  test('a pure bodyweight exercise reads in reps, a weighted one keeps the body weight apart', () => {
    const pullUp = strength('Pull-up', [{ weight: 82, reps: 9 }], { equipment: 'bodyweight' });
    const dip = strength('Dip', [{ weight: 82, reps: 9 }], { equipment: 'bodyweight-weighted' });
    if (dip.rows[0]?.log !== undefined) {
      dip.rows[0].log = { weight: 10, reps: 8, bodyWeight: 82 };
    }
    const summary = buildFinishSummary(input([pullUp, dip], null));

    expect(rowsOf(summary).map((r) => r.value)).toEqual(['9 reps', '82 (+10) kg × 8']);
  });

  test('power reads in its own load', () => {
    const box = power('Box Jump', 'level', [{ weight: 2, reps: 3 }]);
    const ball = power('Ball Slam', 'weight', [{ weight: 20, reps: 4 }]);
    const jump = power('Broad Jump', 'none', [{ weight: 0, reps: 5 }]);
    const summary = buildFinishSummary(
      input(
        [box, ball, jump],
        [
          nextExercise('Box Jump', [{ setNumber: 1, targetReps: 4, suggestedWeight: 2 }], 1),
          nextExercise('Ball Slam', [{ setNumber: 1, targetReps: 4, weightHint: 'increase' }], 2),
          nextExercise('Broad Jump', [{ setNumber: 1, targetReps: 5 }], 3),
        ],
      ),
    );

    expect(rowsOf(summary)).toEqual([
      { name: 'Box Jump', value: 'Level 2 × 3', delta: '+1 rep' },
      { name: 'Ball Slam', value: '20 kg × 4', delta: 'Go heavier' },
      { name: 'Broad Jump', value: '5 reps', delta: undefined },
    ]);
  });

  test('Intervals: rounds and work, and the lever step — more work, less rest, one round more', () => {
    const done = [
      { workSec: 40, restSec: 20 },
      { workSec: 40, restSec: 20 },
    ];
    const work = interval('Bag', done);
    const rest = interval('Bike', done);
    const rounds = interval('Rower', done);
    const summary = buildFinishSummary(
      input(
        [work, rest, rounds],
        [
          nextExercise(
            'Bag',
            [1, 2].map((setNumber) => ({ setNumber, targetWorkSec: 45, targetRestSec: 20 })),
            1,
          ),
          nextExercise(
            'Bike',
            [1, 2].map((setNumber) => ({ setNumber, targetWorkSec: 40, targetRestSec: 15 })),
            2,
          ),
          nextExercise(
            'Rower',
            [1, 2, 3].map((setNumber) => ({ setNumber, targetWorkSec: 40, targetRestSec: 20 })),
            3,
          ),
        ],
      ),
    );

    expect(rowsOf(summary)).toEqual([
      { name: 'Bag', value: '2 × 0:40', delta: '+5 s' },
      { name: 'Bike', value: '2 × 0:40', delta: '−5 s rest' },
      { name: 'Rower', value: '2 × 0:40', delta: '+1 round' },
    ]);
  });

  test('mobility has no progression: its time, nothing on the right', () => {
    const hang = mobility('Dead Hang', [{ workSec: 40, restSec: 0 }]);
    const summary = buildFinishSummary(
      input([hang], [nextExercise('Dead Hang', [{ setNumber: 1, targetWorkSec: 45 }])]),
    );

    expect(rowsOf(summary)).toEqual([{ name: 'Dead Hang', value: '0:40', delta: undefined }]);
    expect(summary).toMatchObject({ subtitle: '1 exercise · 1 set' });
  });

  test('a skipped exercise reads Skipped, with nothing on the right', () => {
    const bench = strength('Bench Press', [undefined, undefined]);
    const bag = interval('Bag', [], 3);
    const summary = buildFinishSummary(
      input(
        [bench, bag],
        [
          nextExercise('Bench Press', [{ setNumber: 1, targetReps: 11 }], 1),
          nextExercise(
            'Bag',
            [1, 2, 3, 4].map((setNumber) => ({ setNumber, targetWorkSec: 40 })),
            2,
          ),
        ],
      ),
    );

    expect(rowsOf(summary)).toEqual([
      { name: 'Bench Press', value: 'Skipped', delta: undefined },
      { name: 'Bag', value: 'Skipped', delta: undefined },
    ]);
  });

  test('Skip workout with nothing logged: Day N skipped, no lead', () => {
    const bench = strength('Bench Press', [undefined]);
    const summary = buildFinishSummary(
      input([bench], [nextExercise('Bench Press', [{ setNumber: 1 }])], { status: 'skipped' }),
    );

    expect(summary).toMatchObject({
      kind: 'day',
      title: 'Day 1 skipped',
      subtitle: '1 exercise · 0 sets',
      lead: undefined,
    });
  });

  test('the same exercise twice in a day is matched in order, once each', () => {
    const first = strength('Bench Press', [{ weight: 80, reps: 10 }], { sessionExerciseId: 'a' });
    const second = strength('Bench Press', [{ weight: 60, reps: 12 }], { sessionExerciseId: 'b' });
    const summary = buildFinishSummary(
      input(
        [first, second],
        [
          nextExercise('Bench Press', [{ setNumber: 1, targetReps: 13 }], 2),
          nextExercise('Bench Press', [{ setNumber: 1, targetReps: 11 }], 1),
        ],
      ),
    );

    expect(rowsOf(summary).map((r) => r.delta)).toEqual(['+1 rep', '+1 rep']);
  });

  test('before a deload: one line about it and no right column', () => {
    const bench = strength('Bench Press', [{ weight: 80, reps: 10 }]);
    const summary = buildFinishSummary({
      ...input([bench], null),
      next: {
        isDeload: true,
        exercises: [
          nextExercise('Bench Press', [{ setNumber: 1, targetReps: 8, weightHint: 'decrease' }]),
        ],
      },
    });

    expect(summary).toMatchObject({
      kind: 'day',
      lead: ['Next week is a ', { strong: 'deload' }, '. Time to recover.'],
    });
    expect(rowsOf(summary)[0]?.delta).toBeUndefined();
  });

  test('in the deload week there is no next week: no lead, no right column', () => {
    const bench = strength('Bench Press', [{ weight: 50, reps: 8 }]);
    const summary = buildFinishSummary(input([bench], null));

    expect(summary).toMatchObject({ kind: 'day', lead: undefined });
    expect(rowsOf(summary)[0]?.delta).toBeUndefined();
  });

  test('with nothing to go to, the button only closes the popup', () => {
    const bench = strength('Bench Press', [{ weight: 80, reps: 10 }]);
    const summary = buildFinishSummary(input([bench], null, { upNext: undefined }));

    expect(summary).toMatchObject({ upNext: undefined, action: 'close', buttonLabel: 'Done' });
  });
});

describe('buildFinishSummary — the last workout of the cycle', () => {
  test('GT-220: Cycle done, weeks and workouts, Finish cycle', () => {
    const summary = buildFinishSummary(
      input([strength('Bench Press', [{ weight: 50, reps: 8 }])], null, {
        upNext: undefined,
        cycle: { lengthWeeks: 6, completedWorkouts: 23, totalWorkouts: 24 },
      }),
    );

    expect(summary).toEqual({
      kind: 'cycle',
      title: 'Cycle done',
      subtitle: '6 weeks · 23 of 24 workouts',
      body: 'Your next cycle can start from where this one ended.',
      action: 'finishCycle',
      buttonLabel: 'Finish cycle',
    });
  });
});

describe('formatUpNext', () => {
  test('the day alone in the same week, with its week in another', () => {
    expect(formatUpNext({ weekNumber: 2, dayNumber: 3 }, 2)).toBe('Day 3');
    expect(formatUpNext({ weekNumber: 3, dayNumber: 1 }, 2)).toBe('Week 3 Day 1');
  });
});

describe('finishSummaryInput', () => {
  const session: Session = {
    ...STAMPS,
    id: 's-w2d1',
    mesoId: 'meso',
    weekNumber: 2,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'completed',
  };
  const nextSession: Session = { ...session, id: 's-w3d1', weekNumber: 3, status: 'planned' };
  const closed: SessionFinishResult = {
    session,
    nextSession,
    nextExercises: [nextExercise('Bench Press', [{ setNumber: 1, targetReps: 11 }])],
  };
  const grid: MesoGrid = {
    mesoId: 'meso',
    name: 'Block',
    lengthWeeks: 2,
    daysPerWeek: 2,
    currentWeekNumber: 2,
    weeks: [
      {
        weekNumber: 1,
        isDeload: false,
        cells: [
          { weekNumber: 1, dayNumber: 1, status: 'completed', sessionId: 's-w1d1' },
          { weekNumber: 1, dayNumber: 2, status: 'skipped', sessionId: 's-w1d2' },
        ],
      },
      {
        weekNumber: 2,
        isDeload: true,
        cells: [
          { weekNumber: 2, dayNumber: 1, status: 'completed', sessionId: 's-w2d1' },
          { weekNumber: 2, dayNumber: 2, status: 'ready', sessionId: 's-w2d2' },
        ],
      },
    ],
  };
  const model = {
    sessionId: 's-w2d1',
    mesoId: 'meso',
    mode: 'readonly',
    exercises: [strength('Bench Press', [{ weight: 80, reps: 10 }])],
    showFinishMesocycle: false,
    nextSessionId: 's-w2d2',
  } as WorkoutSessionModel;

  test('waits until the screen shows the closed day read-only, with its grid', () => {
    expect(finishSummaryInput(closed, undefined, grid)).toBeUndefined();
    expect(finishSummaryInput(closed, { ...model, mode: 'live' }, grid)).toBeUndefined();
    expect(finishSummaryInput(closed, { ...model, sessionId: 'other' }, grid)).toBeUndefined();
    expect(finishSummaryInput(closed, model, undefined)).toBeUndefined();
  });

  test('Up next is the day Next workout opens, and the next week its targets', () => {
    expect(finishSummaryInput(closed, model, grid)).toEqual({
      exercises: model.exercises,
      weekNumber: 2,
      dayNumber: 1,
      status: 'completed',
      next: { isDeload: false, exercises: closed.nextExercises },
      upNext: { weekNumber: 2, dayNumber: 2 },
      cycle: undefined,
    });
  });

  test('the last workout of the block counts the completed workouts of the grid', () => {
    expect(
      finishSummaryInput(
        { ...closed, nextSession: null, nextExercises: [] },
        { ...model, showFinishMesocycle: true, nextSessionId: undefined },
        grid,
      ),
    ).toMatchObject({
      next: null,
      upNext: undefined,
      cycle: { lengthWeeks: 2, completedWorkouts: 2, totalWorkouts: 4 },
    });
  });
});
