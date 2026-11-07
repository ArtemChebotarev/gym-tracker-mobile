// What kind of training a finished day was (GT-247): `strength` when every exercise done in it is a
// strength exercise, `hybrid` when at least one is power, interval or mobility (10 · Hybrid
// Exercises). The rule lives in `workoutKindRules.ts`.

export const WORKOUT_KINDS = ['strength', 'hybrid'] as const;

export type WorkoutKind = (typeof WORKOUT_KINDS)[number];
