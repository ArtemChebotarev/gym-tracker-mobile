// Exercise order within a session — see 05 · Workout Execution & Logging, "Удалить упражнение",
// "Изменить порядок упражнений" and "Добавить внеплановое упражнение". `order` is 1-based with no gaps, and the next week inherits it
// (03, "Структура наследуется от факта"). Pure: the use case layer persists the result.

import { ConflictError, NotFoundError } from '@domain/errors';
import type { SessionExercise } from '@domain/execution';

/** `exercises` sorted by `order` and renumbered 1..n, closing any gaps. */
export function renumbered<E extends Pick<SessionExercise, 'order'>>(exercises: readonly E[]): E[] {
  return [...exercises]
    .sort((a, b) => a.order - b.order)
    .map((exercise, index) => ({ ...exercise, order: index + 1 }));
}

export type MoveDirection = 'up' | 'down';

/**
 * Moves exercise `id` one place `direction` by swapping `order` with its neighbour — `Move up` /
 * `Move down` on 08.7. Returns just the two exercises whose `order` changed. Throws
 * `ConflictError` when there is no neighbour that way (the first can't move up, the last can't move
 * down), and `NotFoundError` when `id` isn't among `exercises`.
 */
export function swappedWithNeighbour<E extends Pick<SessionExercise, 'id' | 'order'>>(
  exercises: readonly E[],
  id: string,
  direction: MoveDirection,
): [E, E] {
  const sorted = [...exercises].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((exercise) => exercise.id === id);
  const moved = sorted[index];
  if (moved === undefined) {
    throw new NotFoundError(`Session exercise "${id}" is not among the exercises to reorder.`);
  }
  const neighbour = sorted[direction === 'up' ? index - 1 : index + 1];
  if (neighbour === undefined) {
    throw new ConflictError(
      `Session exercise "${id}" is already ${direction === 'up' ? 'first' : 'last'}.`,
    );
  }
  return [
    { ...moved, order: neighbour.order },
    { ...neighbour, order: moved.order },
  ];
}

/** The `order` for an exercise appended after every one of `exercises`. */
export function nextOrder(exercises: readonly Pick<SessionExercise, 'order'>[]): number {
  return Math.max(0, ...exercises.map((exercise) => exercise.order)) + 1;
}
