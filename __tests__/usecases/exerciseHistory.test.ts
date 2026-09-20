import { toExerciseId } from '@domain/catalog';
import type { ExerciseHistoryPerformance } from '@domain/exerciseHistory';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { ExerciseHistoryRepository } from '@repositories/exerciseHistory';
import { loadExerciseHistory } from '@usecases/exerciseHistory';
import { STAMPS } from '../fixtures/stamps';

const BENCH = toExerciseId('bench-press');

const PERFORMANCE: ExerciseHistoryPerformance = {
  mesocycle: {
    ...STAMPS,
    id: 'meso-1',
    name: 'Upper/Lower',
    lengthWeeks: 4,
    daysPerWeek: 2,
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    createdAt: '2026-08-01T08:00:00.000Z',
  },
  session: {
    ...STAMPS,
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
      ...STAMPS,
      id: 'log-1',
      sessionExerciseId: 'se-1',
      exerciseId: BENCH,
      setNumber: 1,
      weight: 85,
      reps: 8,
      completedAt: '2026-09-10T11:30:00.000Z',
    },
  ],
};

function deps(performances: ExerciseHistoryPerformance[]): {
  exerciseHistoryRepo: ExerciseHistoryRepository;
} {
  return { exerciseHistoryRepo: { listByExerciseId: jest.fn().mockResolvedValue(performances) } };
}

describe('loadExerciseHistory', () => {
  test('is empty when the exercise has no performances', async () => {
    await expect(loadExerciseHistory(BENCH, deps([]))).resolves.toEqual([]);
  });

  test('groups what the repository returns by mesocycle', async () => {
    const groups = await loadExerciseHistory(BENCH, deps([PERFORMANCE]));

    expect(groups).toHaveLength(1);
    expect(groups[0]?.name).toBe('Upper/Lower');
    expect(groups[0]?.sessions[0]?.weekNumber).toBe(2);
  });

  test('asks the repository for that exercise', async () => {
    const repoDeps = deps([]);
    await loadExerciseHistory(BENCH, repoDeps);

    expect(repoDeps.exerciseHistoryRepo.listByExerciseId).toHaveBeenCalledWith(BENCH);
  });
});
