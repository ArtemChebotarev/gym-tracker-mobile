import type { ExerciseHistoryPerformance } from '@domain/exerciseHistory';

/**
 * Reads one exercise's performances across every mesocycle — the raw material behind the Exercise
 * screen's Overview tab (08.6 · Библиотека упражнений) and, later, its History tab (06 · History &
 * Analytics, Сценарий 2: "Сквозная через все мезоциклы").
 *
 * `SetLog` carries only `sessionExerciseId`, so grouping its rows by performance and joining each
 * to its `Session` is this repository's job (07 · Persistence Layer Contract, rule 4) — the use
 * case layer only hands the result to the domain, which computes every aggregate over it
 * (06: "Агрегаты считаются в доменном слое"). `ExerciseHistoryPerformance` is the domain's own type
 * (domain/exerciseHistory.ts) rather than a second copy declared here.
 */
export interface ExerciseHistoryRepository {
  /**
   * Every performance of `exerciseId`, in no particular order, each with the mesocycle its session
   * belongs to. A performance whose session or mesocycle can't be resolved is omitted — neither an
   * aggregate nor a history row can say where it belongs.
   */
  listByExerciseId(exerciseId: string): Promise<ExerciseHistoryPerformance[]>;
}
