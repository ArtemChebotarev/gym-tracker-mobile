import type { Session, SessionStatus } from '@domain/execution';
import { resolveBaseSession } from '@domain/progressionSource';

function session(
  weekNumber: number,
  status: SessionStatus,
  overrides: Partial<Session> = {},
): Session {
  return {
    id: `meso-1-w${weekNumber}-d1`,
    mesoId: 'meso-1',
    weekNumber,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status,
    ...overrides,
  };
}

describe('resolveBaseSession', () => {
  test.each<SessionStatus>(['planned', 'in_progress'])(
    'a %s trigger leaves the next week awaiting its source',
    (status) => {
      const trigger = session(2, status);
      expect(resolveBaseSession(trigger, [session(1, 'completed'), trigger])).toEqual({
        status: 'awaiting_source',
      });
    },
  );

  test('a completed trigger is its own base', () => {
    const trigger = session(2, 'completed');
    expect(resolveBaseSession(trigger, [session(1, 'completed'), trigger])).toEqual({
      status: 'ready',
      base: trigger,
    });
  });

  test('a skipped trigger falls back to the latest completed session of the same day', () => {
    const week1 = session(1, 'completed');
    const week2 = session(2, 'completed');
    const trigger = session(3, 'skipped');
    expect(resolveBaseSession(trigger, [trigger, week1, week2])).toEqual({
      status: 'ready',
      base: week2,
    });
  });

  test('ignores other days, other mesocycles and later weeks', () => {
    const week1 = session(1, 'skipped');
    const trigger = session(2, 'skipped');
    const sessions = [
      week1,
      trigger,
      session(1, 'completed', { id: 'day-2', dayNumber: 2 }),
      session(1, 'completed', { id: 'other-meso', mesoId: 'meso-0' }),
      session(3, 'completed', { id: 'later' }),
    ];
    expect(resolveBaseSession(trigger, sessions)).toEqual({ status: 'ready', base: week1 });
  });

  test('throws when a skipped trigger has neither a completed session nor week 1 to go back to', () => {
    expect(() => resolveBaseSession(session(2, 'skipped'), [])).toThrow(/No week 1 session/);
  });
});
