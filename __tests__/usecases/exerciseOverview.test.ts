import { toExerciseId, type Exercise } from '@domain/catalog';
import type { ExercisePerformance } from '@domain/exerciseOverview';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';
import { InMemoryExerciseRepository } from '@storage/exerciseRepository';
import { InMemoryStore } from '@storage/store';
import { loadExerciseOverview } from '@usecases/exerciseOverview';

const BENCH = toExerciseId('bench-press');

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: BENCH,
    name: 'Bench Press',
    muscleGroup: 'chest',
    source: 'custom',
    isHidden: false,
    ...overrides,
  };
}

function historyRepo(performances: ExercisePerformance[] = []): ExerciseHistoryRepository {
  return { listByExerciseId: jest.fn().mockResolvedValue(performances) };
}

async function deps(exercises: Exercise[], performances: ExercisePerformance[] = []) {
  const exerciseRepo = new InMemoryExerciseRepository(new InMemoryStore());
  for (const entry of exercises) {
    await exerciseRepo.createCustom(entry);
  }
  return { exerciseRepo, exerciseHistoryRepo: historyRepo(performances) };
}

describe('loadExerciseOverview', () => {
  test('resolves to null when no such exercise exists', async () => {
    await expect(loadExerciseOverview(BENCH, await deps([]))).resolves.toBeNull();
  });

  test('builds the overview for an exercise that was never performed', async () => {
    const overview = await loadExerciseOverview(BENCH, await deps([exercise()]));

    expect(overview?.exercise.name).toBe('Bench Press');
    expect(overview?.stats).toBeNull();
    expect(overview?.actions).toEqual(['edit', 'hide']);
  });

  test('a hidden exercise still opens — history keeps linking to it', async () => {
    const overview = await loadExerciseOverview(BENCH, await deps([exercise({ isHidden: true })]));

    expect(overview?.exercise.isHidden).toBe(true);
  });

  test('folds the performances the history repository returns into the stats', async () => {
    const overview = await loadExerciseOverview(
      BENCH,
      await deps(
        [exercise()],
        [
          {
            session: {
              id: 'session-1',
              mesoId: 'meso-1',
              weekNumber: 2,
              dayNumber: 1,
              isDeload: false,
              prescriptionStatus: 'ready',
              status: 'completed',
              completedAt: '2026-09-10T12:00:00.000Z',
            },
            setLogs: [
              {
                id: 'log-1',
                sessionExerciseId: 'se-1',
                exerciseId: BENCH,
                setNumber: 1,
                weight: 85,
                reps: 8,
                completedAt: '2026-09-10T11:30:00.000Z',
              },
            ],
          },
        ],
      ),
    );

    expect(overview?.stats).toEqual({
      bestSet: { weight: 85, reps: 8 },
      sessionCount: 1,
      lastDoneAt: '2026-09-10T11:30:00.000Z',
    });
    expect(overview?.lastSession?.weekNumber).toBe(2);
    expect(overview?.earlierSessions).toEqual([]);
  });
});
