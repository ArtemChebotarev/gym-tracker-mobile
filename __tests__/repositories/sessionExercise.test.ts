import type { SessionExercise } from '@domain/execution';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';

const benchPressExercise: SessionExercise = {
  id: 'session-exercise-bench-press',
  sessionId: 'session-1',
  exerciseId: 'exercise-bench-press',
  order: 1,
  setTargets: [{ setNumber: 1, targetReps: 8, suggestedWeight: 60 }],
  targetRir: 2,
  status: 'planned',
};

const rowExercise: SessionExercise = {
  id: 'session-exercise-row',
  sessionId: 'session-1',
  exerciseId: 'exercise-row',
  order: 2,
  setTargets: [{ setNumber: 1, targetReps: 10 }],
  targetRir: 2,
  status: 'planned',
};

const otherSessionExercise: SessionExercise = {
  id: 'session-exercise-other-session',
  sessionId: 'session-2',
  exerciseId: 'exercise-squat',
  order: 1,
  setTargets: [{ setNumber: 1, targetReps: 8 }],
  targetRir: 2,
  status: 'planned',
};

function createFakeSessionExerciseRepository(seed: SessionExercise[]): SessionExerciseRepository {
  const sessionExercises = [...seed];

  return {
    async listBySessionId(sessionId) {
      return sessionExercises.filter((exercise) => exercise.sessionId === sessionId);
    },
    async create(sessionExercise) {
      sessionExercises.push(sessionExercise);
      return sessionExercise;
    },
    async createMany(newSessionExercises) {
      sessionExercises.push(...newSessionExercises);
      return [...newSessionExercises];
    },
    async update(sessionExercise) {
      const index = sessionExercises.findIndex((existing) => existing.id === sessionExercise.id);
      if (index !== -1) {
        sessionExercises[index] = sessionExercise;
      }
      return sessionExercise;
    },
    async updateMany(updates) {
      for (const update of updates) {
        const index = sessionExercises.findIndex((existing) => existing.id === update.id);
        if (index !== -1) {
          sessionExercises[index] = update;
        }
      }
      return [...updates];
    },
    async deleteById(id) {
      const index = sessionExercises.findIndex((exercise) => exercise.id === id);
      if (index !== -1) {
        sessionExercises.splice(index, 1);
      }
    },
  };
}

describe('SessionExerciseRepository contract', () => {
  test('listBySessionId returns only exercises planned within that session', async () => {
    const repo = createFakeSessionExerciseRepository([
      benchPressExercise,
      rowExercise,
      otherSessionExercise,
    ]);

    await expect(repo.listBySessionId('session-1')).resolves.toEqual([
      benchPressExercise,
      rowExercise,
    ]);
  });

  test('create and createMany persist new session exercises', async () => {
    const repo = createFakeSessionExerciseRepository([]);

    await repo.create(benchPressExercise);
    await repo.createMany([rowExercise, otherSessionExercise]);

    await expect(repo.listBySessionId('session-1')).resolves.toEqual([
      benchPressExercise,
      rowExercise,
    ]);
  });

  test('update and updateMany replace existing session exercises by id', async () => {
    const repo = createFakeSessionExerciseRepository([benchPressExercise, rowExercise]);

    const updatedBench: SessionExercise = {
      ...benchPressExercise,
      order: 2,
      setTargets: [{ setNumber: 1, targetReps: 9, weightHint: 'increase' }],
    };
    await repo.update(updatedBench);
    await expect(repo.listBySessionId('session-1')).resolves.toContainEqual(updatedBench);

    const updatedRow: SessionExercise = { ...rowExercise, order: 1 };
    await repo.updateMany([updatedRow]);
    await expect(repo.listBySessionId('session-1')).resolves.toContainEqual(updatedRow);
  });

  test('deleteById removes a session exercise', async () => {
    const repo = createFakeSessionExerciseRepository([benchPressExercise, rowExercise]);

    await repo.deleteById(rowExercise.id);

    await expect(repo.listBySessionId('session-1')).resolves.toEqual([benchPressExercise]);
  });
});
