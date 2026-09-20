import type { ExercisePerformance } from '@domain/exerciseOverview';

/**
 * Reads one exercise's performances across every mesocycle — the raw material behind the Exercise
 * screen's Overview tab (08.6 · Библиотека упражнений) and, later, its History tab (06 · History &
 * Analytics, Сценарий 2: "Сквозная через все мезоциклы").
 *
 * `SetLog` carries only `sessionExerciseId`, so grouping its rows by performance and joining each
 * to its `Session` is this repository's job (07 · Persistence Layer Contract, rule 4) — the use
 * case layer only hands the result to the domain, which computes every aggregate over it
 * (06: "Агрегаты считаются в доменном слое"). `ExercisePerformance` is the domain's own type
 * (domain/exerciseOverview.ts) rather than a second copy declared here.
 */
export interface ExerciseHistoryRepository {
  /**
   * Every performance of `exerciseId`, in no particular order. A performance whose session can't
   * be resolved is omitted — an aggregate can't say which mesocycle or week it belongs to.
   */
  listByExerciseId(exerciseId: string): Promise<ExercisePerformance[]>;
}
