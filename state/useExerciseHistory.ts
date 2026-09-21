// Reads the Exercise screen's History tab through the usecase layer via TanStack Query — same
// pattern as useExerciseOverview.ts. See 06 · History & Analytics, Сценарий 2 (task 108).
//
// `enabled` holds the query off until the tab is actually opened: the screen starts on Overview
// every time (08.6), and the whole history of an exercise is a bigger read than the three blocks
// Overview needs. The route turns it on the first time History is picked and leaves it on, so
// switching back and forth doesn't re-read.

import { useQuery } from '@tanstack/react-query';

import type { ExerciseId } from '@domain/catalog';
import { loadExerciseHistory } from '@usecases/exerciseHistory';

import { exerciseHistoryDeps } from './exerciseLibraryStore';

export function useExerciseHistory(exerciseId: ExerciseId, options: { enabled?: boolean } = {}) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryKey: ['exerciseHistory', exerciseId],
    queryFn: () => loadExerciseHistory(exerciseId, exerciseHistoryDeps()),
  });
}
