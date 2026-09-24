// Flow C's source week — which week of a finished block the new one is copied from (04 · Meso
// Creation Flows, "Flow C"; 08.8 · Редактор мезоцикла — Flow C, "Шаг S — Source week"). Types
// only; the rules that build them live in `domain/sourceWeekBuilders.ts`, per the code-style
// skill's domain split.

/**
 * One week offered on step S. Carries nothing about load — no RIR, no weights, no reps: the
 * source week gives the new block its structure and nothing else, and its week 1 targets are
 * computed at Start from each exercise's own history (04, "Расчёт startReps"). A number about
 * load here would suggest picking a different week changes those targets, and it doesn't (08.8,
 * "Чего на этом шаге нет").
 */
export type SourceWeekOption = {
  weekNumber: number;
  /** Sessions of that week that were actually trained — the `M` of `M of K workouts`. */
  completedCount: number;
  /** Sessions the week has at all — the `K`. A week with none is not an option (see builders). */
  sessionCount: number;
};
