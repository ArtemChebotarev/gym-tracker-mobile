import { isConflictError } from '@domain/errors';
import type { Session } from '@domain/execution';
import {
  assertSessionOpen,
  closedSession,
  decideSessionStart,
  isFinalSession,
} from '@domain/sessionLifecycle';
import { STAMPS } from '../fixtures/stamps';

const NOW = '2026-09-18T10:00:00.000Z';

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    ...STAMPS,
    id: 'session-w1-d1',
    mesoId: 'meso',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'planned',
    ...overrides,
  };
}

function errorFrom(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error('Expected the call to throw.');
}

describe('isFinalSession', () => {
  test.each([
    ['planned', false],
    ['in_progress', false],
    ['completed', true],
    ['skipped', true],
  ] as const)('%s → %s', (status, expected) => {
    expect(isFinalSession({ status })).toBe(expected);
  });
});

describe('assertSessionOpen', () => {
  test('accepts a ready planned or in_progress session', () => {
    expect(() => assertSessionOpen(makeSession({ status: 'planned' }))).not.toThrow();
    expect(() => assertSessionOpen(makeSession({ status: 'in_progress' }))).not.toThrow();
  });

  test.each(['completed', 'skipped'] as const)('rejects a %s session', (status) => {
    expect(isConflictError(errorFrom(() => assertSessionOpen(makeSession({ status }))))).toBe(true);
  });

  test('rejects an awaiting_source session', () => {
    const session = makeSession({ prescriptionStatus: 'awaiting_source' });

    expect(isConflictError(errorFrom(() => assertSessionOpen(session)))).toBe(true);
  });
});

describe('decideSessionStart', () => {
  test('a planned session with nothing in progress starts now', () => {
    const session = makeSession();

    expect(decideSessionStart(session, null, NOW)).toEqual({
      kind: 'started',
      session: { ...session, status: 'in_progress', startedAt: NOW },
    });
  });

  test('an in_progress session continues with its original startedAt', () => {
    const session = makeSession({ status: 'in_progress', startedAt: '2026-09-18T09:00:00.000Z' });

    expect(decideSessionStart(session, session, NOW)).toEqual({ kind: 'continued', session });
  });

  test('another in_progress session is a conflict naming it', () => {
    const other = makeSession({ id: 'session-w1-d2', dayNumber: 2, status: 'in_progress' });

    expect(decideSessionStart(makeSession(), other, NOW)).toEqual({
      kind: 'conflict',
      inProgressSessionId: 'session-w1-d2',
    });
  });

  test.each(['completed', 'skipped'] as const)('rejects a %s session', (status) => {
    const error = errorFrom(() => decideSessionStart(makeSession({ status }), null, NOW));

    expect(isConflictError(error)).toBe(true);
  });

  test('rejects an awaiting_source session', () => {
    const session = makeSession({ prescriptionStatus: 'awaiting_source' });

    expect(isConflictError(errorFrom(() => decideSessionStart(session, null, NOW)))).toBe(true);
  });
});

describe('closedSession', () => {
  test('a session with a logged set is completed, and dated', () => {
    expect(closedSession(makeSession({ status: 'in_progress' }), true, NOW)).toEqual(
      makeSession({ status: 'completed', completedAt: NOW }),
    );
  });

  test('a session with nothing logged is skipped, and undated', () => {
    const closed = closedSession(makeSession({ status: 'in_progress' }), false, NOW);

    expect(closed.status).toBe('skipped');
    expect(closed.completedAt).toBeUndefined();
  });
});
