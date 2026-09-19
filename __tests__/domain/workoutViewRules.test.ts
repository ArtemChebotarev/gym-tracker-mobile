import type { Session, SessionExercise } from '@domain/execution';
import {
  canFinishSession,
  previewSourceSession,
  sessionDisplayDate,
  sessionProgress,
  unlockingSlot,
  workoutMode,
} from '@domain/workoutViewRules';

function session(overrides: Partial<Session> = {}): Session {
  return {
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
  test.each([
    [{ status: 'planned', prescriptionStatus: 'ready' }, 'live'],
    [{ status: 'in_progress', prescriptionStatus: 'ready' }, 'live'],
    [{ status: 'completed', prescriptionStatus: 'ready' }, 'readonly'],
    [{ status: 'skipped', prescriptionStatus: 'ready' }, 'readonly'],
    [{ status: 'planned', prescriptionStatus: 'awaiting_source' }, 'preview'],
  ] as const)('%o opens in %s mode', (state, mode) => {
    expect(workoutMode(state)).toBe(mode);
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
