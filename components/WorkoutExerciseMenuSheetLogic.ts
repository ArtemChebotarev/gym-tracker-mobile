// Pure helpers behind components/WorkoutExerciseMenuSheet.tsx — see the code-style skill.

import type { ActionRowVariant } from '@design/components/ActionRow';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import { ArrowUpIcon } from '@design/icons/ArrowUpIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { MinusIcon } from '@design/icons/MinusIcon';
import { PlusIcon } from '@design/icons/PlusIcon';
import { SkipIcon } from '@design/icons/SkipIcon';
import { SwapIcon } from '@design/icons/SwapIcon';
import { TrashIcon } from '@design/icons/TrashIcon';
import type { ExerciseCommand } from '@state/useExerciseCommand';
import type { WorkoutExerciseActions } from '@usecases/workoutSession';

/** The exercise menu's actions (08.7, "Меню упражнения"): Replace plus the one-tap commands. */
export type ExerciseMenuItem = 'replace' | ExerciseCommand;

export const EXERCISE_MENU_ACTIONS: Record<
  ExerciseMenuItem,
  { label: string; icon: IconComponent; variant: ActionRowVariant }
> = {
  replace: { label: 'Replace exercise', icon: SwapIcon, variant: 'default' },
  addSet: { label: 'Add set', icon: PlusIcon, variant: 'default' },
  removeLastSet: { label: 'Remove last set', icon: MinusIcon, variant: 'default' },
  moveUp: { label: 'Move up', icon: ArrowUpIcon, variant: 'default' },
  moveDown: { label: 'Move down', icon: ArrowDownIcon, variant: 'default' },
  skip: { label: 'Skip exercise', icon: SkipIcon, variant: 'default' },
  unskip: { label: 'Unskip exercise', icon: SkipIcon, variant: 'default' },
  delete: { label: 'Delete exercise', icon: TrashIcon, variant: 'danger' },
};

export type ExerciseMenuRow = {
  item: ExerciseMenuItem;
  /** Set when the action isn't available — the row is disabled and shows why. */
  disabledReason?: string;
};

/**
 * The rows of an exercise's menu, in the 08.7 order. Remove last set and the moves stay listed
 * when they're not available, disabled with the reason (`Only one set`, `Already first`, `Already
 * last`); Skip and Unskip take turns in one place. Replace, Add set, Skip and Delete are always
 * available, logged sets or not — 088 works all of it out from the exercise.
 */
export function exerciseMenuRows(actions: WorkoutExerciseActions): ExerciseMenuRow[] {
  const row = (item: ExerciseMenuItem, available: boolean, reason: string): ExerciseMenuRow =>
    available ? { item } : { item, disabledReason: reason };
  return [
    { item: 'replace' },
    { item: 'addSet' },
    row('removeLastSet', actions.canRemoveLastSet, 'Only one set'),
    row('moveUp', actions.canMoveUp, 'Already first'),
    row('moveDown', actions.canMoveDown, 'Already last'),
    { item: actions.canUnskip ? 'unskip' : 'skip' },
    { item: 'delete' },
  ];
}

function formatSetCount(count: number): string {
  return `${count} set${count === 1 ? '' : 's'}`;
}

/** The sheet's subtitle (08.7, "Меню упражнения"): `2 sets planned · 1 logged`. */
export function formatExerciseMenuSubtitle(plannedSetCount: number, loggedSetCount: number) {
  return `${formatSetCount(plannedSetCount)} planned · ${loggedSetCount} logged`;
}

/**
 * The Delete exercise confirmation's message (05, "Удалить упражнение"): the exercise won't carry
 * over to next week, and — once it's started — its logged sets go with it.
 */
export function formatDeleteExerciseWarning(loggedSetCount: number): string {
  const fromNextWeek = "It won't carry over to next week.";
  if (loggedSetCount === 0) {
    return fromNextWeek;
  }
  return `Its ${formatSetCount(loggedSetCount)} logged will be deleted too. ${fromNextWeek}`;
}

/**
 * The Skip exercise confirmation's message (05, "Пропустить упражнение"): logged sets stay, the
 * rest of the rows are skipped. The exercise carries over to next week either way.
 */
export function formatSkipExerciseWarning(plannedSetCount: number, loggedSetCount: number) {
  const unlogged = plannedSetCount - loggedSetCount;
  if (loggedSetCount === 0) {
    return `All ${formatSetCount(plannedSetCount)} will be skipped.`;
  }
  if (unlogged === 0) {
    return `All ${formatSetCount(loggedSetCount)} are logged and will stay.`;
  }
  return `Its ${formatSetCount(loggedSetCount)} logged will stay; ${formatSetCount(unlogged)} not logged will be skipped.`;
}

/**
 * The Replace exercise danger confirmation's message (05, "Заменить упражнение"), shown before the
 * picker opens and only when the exercise has logged sets: they're deleted by the swap.
 */
export function formatReplaceExerciseWarning(exerciseName: string, loggedSetCount: number) {
  return `The ${formatSetCount(loggedSetCount)} logged for ${exerciseName} will be deleted.`;
}
