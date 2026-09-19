import { MOCK_MESOCYCLE_IDS } from '@domain/mesocycleMocks';
import { buildMockWorkout, MOCK_SESSION_IDS } from '@domain/workoutMocks';
import { sessionProgress, workoutMode } from '@domain/workoutViewRules';

const NOW = new Date('2026-09-19T12:00:00.000Z');

function sessionById(id: string) {
  const session = buildMockWorkout(NOW).sessions.find((candidate) => candidate.id === id);
  if (!session) {
    throw new Error(`No mock session "${id}"`);
  }
  return session;
}

function progressOf(id: string): number {
  const mock = buildMockWorkout(NOW);
  const exercises = mock.sessionExercises
    .filter((exercise) => exercise.sessionId === id)
    .map((sessionExercise) => ({
      sessionExercise,
      setLogs: mock.setLogs.filter((log) => log.sessionExerciseId === sessionExercise.id),
    }));
  return sessionProgress(sessionById(id), exercises);
}

describe('buildMockWorkout', () => {
  test('every session belongs to the active mock mesocycle', () => {
    for (const session of buildMockWorkout(NOW).sessions) {
      expect(session.mesoId).toBe(MOCK_MESOCYCLE_IDS.active);
    }
  });

  test('covers the three workout screen modes', () => {
    expect(workoutMode(sessionById(MOCK_SESSION_IDS.completed))).toBe('readonly');
    expect(workoutMode(sessionById(MOCK_SESSION_IDS.live))).toBe('live');
    expect(workoutMode(sessionById(MOCK_SESSION_IDS.preview))).toBe('preview');
  });

  test('the completed session is fully logged and the live one is partly logged', () => {
    expect(progressOf(MOCK_SESSION_IDS.completed)).toBe(1);
    expect(progressOf(MOCK_SESSION_IDS.live)).toBeCloseTo(2 / 6);
  });

  test('every set log points at a mock session exercise with the same exercise', () => {
    const mock = buildMockWorkout(NOW);
    for (const log of mock.setLogs) {
      const exercise = mock.sessionExercises.find((ex) => ex.id === log.sessionExerciseId);
      expect(exercise?.exerciseId).toBe(log.exerciseId);
    }
  });

  test('the live session started today', () => {
    expect(sessionById(MOCK_SESSION_IDS.live).startedAt?.slice(0, 10)).toBe('2026-09-19');
  });
});
