import type { SessionExercise } from '@domain/execution';
import { InMemorySessionExerciseRepository } from '@storage/sessionExercise';
import { InMemoryStore } from '@storage/store';

function makeExercise(overrides: Partial<SessionExercise> = {}): SessionExercise {
  return {
    id: 'session-exercise-1',
    sessionId: 'session-1',
    exerciseId: 'exercise-bench-press',
    order: 1,
    setTargets: [{ setNumber: 1, targetReps: 8 }],
    targetRir: 2,
    status: 'planned',
    ...overrides,
  };
}

describe('InMemorySessionExerciseRepository', () => {
  test('listBySessionId returns only exercises for that session', async () => {
    const repo = new InMemorySessionExerciseRepository(new InMemoryStore());
    await repo.createMany([
      makeExercise({ id: 'se-1' }),
      makeExercise({ id: 'se-2', order: 2 }),
      makeExercise({ id: 'se-other', sessionId: 'session-2' }),
    ]);

    const result = await repo.listBySessionId('session-1');

    expect(result.map((exercise) => exercise.id).sort()).toEqual(['se-1', 'se-2']);
  });

  test('create and update round-trip a session exercise', async () => {
    const repo = new InMemorySessionExerciseRepository(new InMemoryStore());
    await repo.create(makeExercise());

    const updated = await repo.update(makeExercise({ order: 3, status: 'completed' }));

    await expect(repo.listBySessionId('session-1')).resolves.toEqual([updated]);
  });

  test('updateMany replaces several session exercises in one call, e.g. reordering after a swap', async () => {
    const repo = new InMemorySessionExerciseRepository(new InMemoryStore());
    await repo.createMany([
      makeExercise({ id: 'se-1', order: 1 }),
      makeExercise({ id: 'se-2', order: 2 }),
    ]);

    const reordered = await repo.updateMany([
      makeExercise({ id: 'se-1', order: 2 }),
      makeExercise({ id: 'se-2', order: 1 }),
    ]);

    expect(reordered.map((exercise) => exercise.order)).toEqual([2, 1]);
    const stored = await repo.listBySessionId('session-1');
    expect(stored.find((exercise) => exercise.id === 'se-1')?.order).toBe(2);
    expect(stored.find((exercise) => exercise.id === 'se-2')?.order).toBe(1);
  });

  test('deleteById removes a session exercise', async () => {
    const repo = new InMemorySessionExerciseRepository(new InMemoryStore());
    await repo.create(makeExercise());

    await repo.deleteById('session-exercise-1');

    await expect(repo.listBySessionId('session-1')).resolves.toEqual([]);
  });
});
