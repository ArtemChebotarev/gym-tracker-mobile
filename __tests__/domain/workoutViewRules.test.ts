import type { Session, SessionExercise } from '@domain/execution';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  canFinishSession,
  exerciseWeightHints,
  previewSourceSession,
  sessionDisplayDate,
  sessionProgress,
  unlockingSlot,
  workoutMode,
} from '@domain/workoutViewRules';
import { STAMPS } from '../fixtures/stamps';

function session(overrides: Partial<Session> = {}): Session {
  return {
    ...STAMPS,
    id: 'session',
    mesoId: 'meso',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

function exercise(
  rows: number,
  status: SessionExercise['status'],
  loggedSetNumbers: number[] = [],
) {
  return {
    sessionExercise: {
      setTargets: Array.from({ length: rows }, (_, index) => ({ setNumber: index + 1 })),
      status,
    },
    setLogs: loggedSetNumbers.map((setNumber) => ({ setNumber })),
  };
}

describe('workoutMode', () => {
  const ACTIVE = { status: 'active' } as const;

  test.each([
    [{ status: 'planned', prescriptionStatus: 'ready' }, 'live'],
    [{ status: 'in_progress', prescriptionStatus: 'ready' }, 'live'],
    [{ status: 'completed', prescriptionStatus: 'ready' }, 'readonly'],
    [{ status: 'skipped', prescriptionStatus: 'ready' }, 'readonly'],
    [{ status: 'planned', prescriptionStatus: 'awaiting_source' }, 'preview'],
  ] as const)('%o of an active block opens in %s mode', (state, mode) => {
    expect(workoutMode(state, ACTIVE)).toBe(mode);
  });

  // DoD of task 128: the mode comes from the block, not from a route parameter (08.9).
  test.each(['completed', 'abandoned'] as const)(
    'DoD: a session of a %s block opens in history mode',
    (status) => {
      expect(workoutMode({ status: 'completed', prescriptionStatus: 'ready' }, { status })).toBe(
        'history',
      );
    },
  );

  test('DoD: the same session in an active block is read-only, not history', () => {
    expect(workoutMode({ status: 'completed', prescriptionStatus: 'ready' }, ACTIVE)).toBe(
      'readonly',
    );
  });

  test('a closed block leaves no session out of history, whatever its own status', () => {
    const closed = { status: 'abandoned' } as const;

    expect(workoutMode({ status: 'skipped', prescriptionStatus: 'awaiting_source' }, closed)).toBe(
      'history',
    );
  });

  test('a planned block is not history — nothing in it has been trained yet', () => {
    expect(
      workoutMode({ status: 'planned', prescriptionStatus: 'ready' }, { status: 'planned' }),
    ).toBe('live');
  });
});

describe('sessionDisplayDate', () => {
  test('a completed session shows completedAt', () => {
    expect(
      sessionDisplayDate(
        session({ status: 'completed', startedAt: 'started', completedAt: 'completed' }),
      ),
    ).toBe('completed');
  });

  test('a started session shows startedAt', () => {
    expect(sessionDisplayDate(session({ status: 'in_progress', startedAt: 'started' }))).toBe(
      'started',
    );
  });

  test('a session not started yet has no date', () => {
    expect(sessionDisplayDate(session())).toBeUndefined();
  });
});

describe('sessionProgress', () => {
  test('counts logged rows plus every row of a skipped exercise', () => {
    const progress = sessionProgress(session({ status: 'in_progress' }), [
      exercise(3, 'planned', [1]),
      exercise(2, 'skipped', [1]),
      exercise(3, 'planned'),
    ]);

    expect(progress).toBeCloseTo(3 / 8);
  });

  test('counts every row of an abandoned exercise the same way (136)', () => {
    const progress = sessionProgress(session({ status: 'in_progress' }), [
      exercise(3, 'planned', [1]),
      exercise(2, 'abandoned'),
    ]);

    expect(progress).toBeCloseTo(3 / 5);
  });

  test('ignores logs of rows that no longer exist', () => {
    expect(sessionProgress(session(), [exercise(2, 'planned', [1, 3])])).toBe(0.5);
  });

  test('a completed session is always full', () => {
    expect(sessionProgress(session({ status: 'completed' }), [exercise(3, 'completed', [1])])).toBe(
      1,
    );
  });

  test('a session with no rows is empty', () => {
    expect(sessionProgress(session(), [])).toBe(0);
  });
});

describe('canFinishSession', () => {
  test('every exercise completed or skipped', () => {
    expect(canFinishSession([{ status: 'completed' }, { status: 'skipped' }])).toBe(true);
  });

  test('not while any exercise is planned', () => {
    expect(canFinishSession([{ status: 'completed' }, { status: 'planned' }])).toBe(false);
  });
});

describe('previewSourceSession', () => {
  const slot = { mesoId: 'meso', weekNumber: 4, dayNumber: 2 };

  test('the latest programmed session of the same day before the slot', () => {
    const sessions = [
      session({ id: 'w1d2', weekNumber: 1, dayNumber: 2, status: 'completed' }),
      session({ id: 'w2d2', weekNumber: 2, dayNumber: 2, status: 'skipped' }),
      session({ id: 'w3d1', weekNumber: 3, dayNumber: 1 }),
      session({ id: 'w3d2', weekNumber: 3, dayNumber: 2, prescriptionStatus: 'awaiting_source' }),
      session({ id: 'other-meso', mesoId: 'other', weekNumber: 3, dayNumber: 2 }),
    ];

    expect(previewSourceSession(slot, sessions)?.id).toBe('w2d2');
  });

  test('none when the day was never programmed', () => {
    expect(previewSourceSession(slot, [session({ weekNumber: 1, dayNumber: 1 })])).toBeUndefined();
  });
});

describe('unlockingSlot', () => {
  test('is the same day of the previous week', () => {
    expect(unlockingSlot({ mesoId: 'meso', weekNumber: 7, dayNumber: 3 })).toEqual({
      mesoId: 'meso',
      weekNumber: 6,
      dayNumber: 3,
    });
  });
});

describe('exerciseWeightHints', () => {
  const corridor = { ...defaultProgressionSettings, minReps: 6, maxReps: 25 };

  test('none when no row has a hint', () => {
    expect(exerciseWeightHints([{}, {}], corridor)).toEqual([]);
  });

  test('each direction once, with the corridor bound behind it — go heavier first', () => {
    expect(
      exerciseWeightHints(
        [{ weightHint: 'decrease' }, {}, { weightHint: 'increase' }, { weightHint: 'decrease' }],
        corridor,
      ),
    ).toEqual([
      { direction: 'increase', reps: 25 },
      { direction: 'decrease', reps: 6 },
    ]);
  });
});
