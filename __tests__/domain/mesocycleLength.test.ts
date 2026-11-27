import { isConflictError } from '@domain/errors';
import type { Session, SessionExercise } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import {
  lastStartedWeek,
  mesocycleLengthBounds,
  mesocycleWithLength,
  replannedSessionExercises,
} from '@domain/mesocycleLength';
import { prescribeNextSession } from '@domain/progressionPlan';
import { clampedTargetRir, rirSchedule } from '@domain/progressionRir';

import { STAMPS } from '../fixtures/stamps';

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Upper/Lower',
  lengthWeeks: 8,
  daysPerWeek: 2,
  startDate: '2026-09-01T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
  weightUnit: 'kg',
};

type Slot = Pick<Session, 'weekNumber' | 'status'>;

/** Weeks 1..`done` fully completed, `inProgress` week (if any) with day 1 started. */
function trainedUpTo(done: number, inProgress?: number): Slot[] {
  const slots: Slot[] = [];
  for (let week = 1; week <= done; week += 1) {
    slots.push(
      { weekNumber: week, status: 'completed' },
      { weekNumber: week, status: 'completed' },
    );
  }
  if (inProgress !== undefined) {
    slots.push({ weekNumber: inProgress, status: 'in_progress' });
    slots.push({ weekNumber: inProgress, status: 'planned' });
  }
  // The generated, untouched next week.
  slots.push({ weekNumber: (inProgress ?? done) + 1, status: 'planned' });
  return slots;
}

describe('lastStartedWeek', () => {
  test('a planned session starts nothing; any other status does, a skipped day included', () => {
    expect(lastStartedWeek([{ weekNumber: 1, status: 'planned' }])).toBe(0);
    expect(
      lastStartedWeek([
        { weekNumber: 3, status: 'skipped' },
        { weekNumber: 4, status: 'planned' },
      ]),
    ).toBe(3);
  });
});

describe('mesocycleLengthBounds', () => {
  test('five weeks done: the shortest is six', () => {
    expect(mesocycleLengthBounds(mesocycle, trainedUpTo(5))).toEqual({ min: 6, max: 8 });
  });

  test('week 5 started with one log: the shortest is six too', () => {
    expect(mesocycleLengthBounds(mesocycle, trainedUpTo(4, 5))).toEqual({ min: 6, max: 8 });
  });

  test('right after Start the editor floor of 4 applies', () => {
    expect(mesocycleLengthBounds(mesocycle, [{ weekNumber: 1, status: 'planned' }])).toEqual({
      min: 4,
      max: 8,
    });
  });

  test('a 3-week block from before the floor can only grow', () => {
    const threeWeeks = { ...mesocycle, lengthWeeks: 3 };
    expect(mesocycleLengthBounds(threeWeeks, [{ weekNumber: 1, status: 'planned' }])).toEqual({
      min: 3,
      max: 8,
    });
  });

  test('once the deload has started the length is locked', () => {
    const fourWeeks = { ...mesocycle, lengthWeeks: 4 };
    expect(mesocycleLengthBounds(fourWeeks, trainedUpTo(3, 4))).toEqual({ min: 4, max: 4 });
  });
});

/** The rest of a block after a change: each week planned from the one before, as generation does. */
function plannedAfterChange(trained: readonly number[], lengthWeeks: number): number[] {
  const weeks = [...trained];
  for (let week = trained.length + 1; week < lengthWeeks; week += 1) {
    weeks.push(clampedTargetRir(lengthWeeks, week, weeks.at(-1)));
  }
  return weeks;
}

describe('the RIR after a length change', () => {
  // The table of GT-240: rule 4's table of the new length, within one step of the week before.
  test.each([
    { from: 8, to: 6, trained: [3, 3, 2, 2], expected: [3, 3, 2, 2, 1] },
    { from: 8, to: 5, trained: [3, 3], expected: [3, 3, 2, 1] },
    { from: 8, to: 6, trained: [3, 3, 2], expected: [3, 3, 2, 1, 0] },
    { from: 6, to: 8, trained: [3, 3, 2, 1], expected: [3, 3, 2, 1, 1, 1, 0] },
    { from: 5, to: 8, trained: [3, 2], expected: [3, 2, 2, 2, 1, 1, 0] },
    { from: 7, to: 8, trained: [3, 3, 2, 2, 1, 0], expected: [3, 3, 2, 2, 1, 0, 0] },
    { from: 4, to: 6, trained: [2], expected: [2, 2, 2, 1, 0] },
  ])('$from → $to weeks after $trained', ({ trained, to, expected }) => {
    expect(plannedAfterChange(trained, to)).toEqual(expected);
  });

  test.each([4, 5, 6, 7, 8])(
    'a %i-week block whose length never changed reads its row',
    (length) => {
      expect(plannedAfterChange([rirSchedule(length)[0] as number], length)).toEqual(
        rirSchedule(length),
      );
    },
  );
});

describe('mesocycleWithLength', () => {
  test('takes the new length and nothing else', () => {
    expect(mesocycleWithLength(mesocycle, trainedUpTo(3, 4), 6)).toEqual({
      ...mesocycle,
      lengthWeeks: 6,
    });
  });

  test.each([
    ['below the last started week + 1', 5],
    ['below the editor floor', 3],
    ['above 8', 9],
    ['not a whole number', 6.5],
  ])('rejects a length %s', (_, lengthWeeks) => {
    let error: unknown;
    try {
      mesocycleWithLength(mesocycle, trainedUpTo(5), lengthWeeks);
    } catch (caught) {
      error = caught;
    }
    expect(isConflictError(error)).toBe(true);
  });

  test('rejects a block that is not active', () => {
    let error: unknown;
    try {
      mesocycleWithLength({ ...mesocycle, status: 'completed' }, [], 6);
    } catch (caught) {
      error = caught;
    }
    expect(isConflictError(error)).toBe(true);
  });
});

describe('replannedSessionExercises', () => {
  const row = (overrides: Partial<SessionExercise>): SessionExercise => ({
    ...STAMPS,
    id: 'se',
    sessionId: 's',
    exerciseId: 'bench',
    order: 1,
    setTargets: [
      { setNumber: 1, targetReps: 11, suggestedWeight: 60 },
      { setNumber: 2, targetReps: 10, suggestedWeight: 60 },
    ],
    targetRir: 1,
    status: 'planned',
    ...overrides,
  });

  test('a week that keeps its role moves only its RIR', () => {
    expect(replannedSessionExercises([row({})], { targetRir: 2, isDeload: false })).toEqual([
      row({ targetRir: 2 }),
    ]);
  });

  test('a week that turns into the deload takes the new plan, and a row added before the start loses its numbers', () => {
    const added = row({ id: 'se-2', exerciseId: 'fly', order: 2 });
    const replanned = replannedSessionExercises([row({}), added], {
      targetRir: 8,
      isDeload: true,
      prescriptions: [
        {
          exerciseId: 'bench',
          order: 1,
          setTargets: [
            { setNumber: 1, suggestedWeight: 30 },
            { setNumber: 2, suggestedWeight: 30 },
          ],
          targetRir: 8,
        },
      ],
    });
    expect(replanned[0]).toMatchObject({
      id: 'se',
      targetRir: 8,
      setTargets: [
        { setNumber: 1, suggestedWeight: 30 },
        { setNumber: 2, suggestedWeight: 30 },
      ],
    });
    expect(replanned[1]).toMatchObject({
      id: 'se-2',
      targetRir: 8,
      setTargets: [{ setNumber: 1 }, { setNumber: 2 }],
    });
  });
});

describe('the engine after a length change', () => {
  test('plans a working week within one step of the week before, not at the new row', () => {
    // 8 → 5 cut after week 2 (3, 3): the 5-week row says 1 for week 3; one step down is 2.
    const [plan] = prescribeNextSession({
      exercises: [
        {
          sessionExercise: {
            id: 'se',
            exerciseId: 'bench',
            order: 1,
            setTargets: [{ setNumber: 1 }],
          },
          muscleGroup: 'chest',
        },
      ],
      logs: [],
      weekNumber: 3,
      lengthWeeks: 5,
      previousRir: 3,
      settings: defaultProgressionSettings,
    });
    expect(plan?.targetRir).toBe(2);
  });
});
