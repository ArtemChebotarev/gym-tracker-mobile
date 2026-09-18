// Workout screen concepts — see 08.7 · Тренировка, "Режимы экрана" and "Preview непосчитанного
// дня". The rules that derive them live in `domain/workoutViewRules.ts`.

/**
 * How the workout screen shows a session:
 * - `live` — `planned` and `ready`, or `in_progress`: sets can be logged, every action is on.
 * - `readonly` — `completed` or `skipped`: look only, nothing can be changed.
 * - `preview` — `awaiting_source`, or no session yet: only the exercise list, with no sets.
 */
export type WorkoutMode = 'live' | 'readonly' | 'preview';

/** One cell of a mesocycle's week × day grid, whether or not its session exists yet. */
export type WorkoutSlot = {
  mesoId: string;
  weekNumber: number;
  dayNumber: number;
};
