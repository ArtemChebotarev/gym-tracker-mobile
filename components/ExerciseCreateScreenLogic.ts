// Pure, non-JSX logic behind ExerciseCreateScreen.tsx — see the code-style skill.

import type { Href } from 'expo-router';

import { EXERCISE_TYPES, type ExerciseType } from '@domain/catalog';

/** The "New exercise" page for `type`, with the library search text as a starting name. */
export function newExerciseHref(type: ExerciseType, name: string): Href {
  return { pathname: '/exercise/new', params: { type, name } };
}

/** The type a route param names; `strength` for anything else, so a bad link still opens. */
export function exerciseTypeFromParam(param: string | undefined): ExerciseType {
  return EXERCISE_TYPES.find((type) => type === param) ?? 'strength';
}
