// Exercise order within a session — see 05 · Workout Execution & Logging, "Удалить упражнение"
// and "Изменить порядок упражнений". `order` is 1-based with no gaps, and the next week inherits it
// (03, "Структура наследуется от факта"). Pure: the use case layer persists the result.

import type { SessionExercise } from '@domain/execution';

/** `exercises` sorted by `order` and renumbered 1..n, closing any gaps. */
export function renumbered<E extends Pick<SessionExercise, 'order'>>(exercises: readonly E[]): E[] {
  return [...exercises]
    .sort((a, b) => a.order - b.order)
    .map((exercise, index) => ({ ...exercise, order: index + 1 }));
}
