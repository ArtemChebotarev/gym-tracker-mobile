import type { SessionExercise, SetLog } from '@domain/execution';
import { statusFromLogs } from '@domain/sessionExerciseStatus';

const benchPress: Pick<SessionExercise, 'id' | 'setTargets'> = {
  id: 'session-exercise-bench-press',
  setTargets: [{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }],
};

function logFor(setNumber: number, sessionExerciseId = benchPress.id): SetLog {
  return {
    id: `log-${sessionExerciseId}-${setNumber}`,
    sessionExerciseId,
    exerciseId: 'exercise-bench-press',
    setNumber,
    weight: 60,
    reps: 10,
    completedAt: '2026-09-18T10:00:00.000Z',
  };
}

describe('statusFromLogs', () => {
  test('no logs → planned', () => {
    expect(statusFromLogs(benchPress, [])).toBe('planned');
  });

  test('some rows logged → planned', () => {
    expect(statusFromLogs(benchPress, [logFor(1), logFor(3)])).toBe('planned');
  });

  test('every row logged → completed', () => {
    expect(statusFromLogs(benchPress, [logFor(1), logFor(2), logFor(3)])).toBe('completed');
  });

  test('logs of another session exercise are ignored', () => {
    const otherLogs = [1, 2, 3].map((setNumber) => logFor(setNumber, 'session-exercise-row'));

    expect(statusFromLogs(benchPress, [logFor(1), ...otherLogs])).toBe('planned');
  });

  test('a log for a row that no longer exists does not count toward the rows that do', () => {
    expect(statusFromLogs(benchPress, [logFor(1), logFor(2), logFor(4)])).toBe('planned');
  });
});
