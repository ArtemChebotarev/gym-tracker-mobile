// Workout screen concepts — see 08.7 · Тренировка, "Режимы экрана" and "Preview непосчитанного
// дня". The rules that derive them live in `domain/workoutViewRules.ts`.

/**
 * How the workout screen shows a session:
 * - `live` — `planned` and `ready`, or `in_progress`: sets can be logged, every action is on.
 * - `readonly` — `completed` or `skipped`: look only, nothing can be changed.
 * - `history` — any session of a `completed` or `abandoned` mesocycle (08.9): read-only, and
 *   without the grid button, the header `⋯` and `Next workout` — a block that has ended has no
 *   next workout, and its own actions live on its detail screen. Opened from there, read, left
 *   backwards.
 * - `preview` — `awaiting_source`, or no session yet: only the exercise list, with no sets.
 */
export type WorkoutMode = 'live' | 'readonly' | 'history' | 'preview';

/** One cell of a mesocycle's week × day grid, whether or not its session exists yet. */
export type WorkoutSlot = {
  mesoId: string;
  weekNumber: number;
  dayNumber: number;
};

/**
 * Which day the workout screen shows when one is picked (the mesocycle overview's cells, `Next
 * workout`): a session by id, or a grid cell whose session may not exist yet.
 */
export type WorkoutPick = { sessionId: string } | { slot: WorkoutSlot };
