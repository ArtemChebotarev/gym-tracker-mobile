// Pure helpers behind an exercise card's `⋯` menu (08.7, "Меню упражнения") — see the code-style
// skill. The menu itself is `ActionMenu` (117), rendered by components/WorkoutExerciseCard.tsx;
// this only decides which actions an exercise offers and how each one reads.

import type { ActionMenuItem } from '@design/components/ActionMenu';
import { ArrowDownIcon } from '@design/icons/ArrowDownIcon';
import { ArrowUpIcon } from '@design/icons/ArrowUpIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { MinusIcon } from '@design/icons/MinusIcon';
import { PlusIcon } from '@design/icons/PlusIcon';
import { SkipIcon } from '@design/icons/SkipIcon';
import { SwapIcon } from '@design/icons/SwapIcon';
import { TrashIcon } from '@design/icons/TrashIcon';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { ExerciseCommand } from '@state/useExerciseCommand';
import type { WorkoutExerciseActions } from '@usecases/workoutSession';

/** The exercise menu's actions (08.7, "Меню упражнения"): Replace plus the one-tap commands. */
export type ExerciseMenuItem = 'replace' | ExerciseCommand;

/**
 * How each action reads. `icon` is drawn by the fallback sheet off iOS and `systemImage` by the
 * native menu on it — the two icon sets don't overlap, so an action names one of each.
 */
export const EXERCISE_MENU_ACTIONS: Record<
  ExerciseMenuItem,
  { label: string; icon: IconComponent; systemImage: SFSymbol; destructive?: boolean }
> = {
  replace: {
    label: 'Replace exercise',
    icon: SwapIcon,
    systemImage: 'arrow.triangle.2.circlepath',
  },
  addSet: { label: 'Add set', icon: PlusIcon, systemImage: 'plus' },
  removeLastSet: { label: 'Remove last set', icon: MinusIcon, systemImage: 'minus' },
  moveUp: { label: 'Move up', icon: ArrowUpIcon, systemImage: 'arrow.up' },
  moveDown: { label: 'Move down', icon: ArrowDownIcon, systemImage: 'arrow.down' },
  skip: { label: 'Skip exercise', icon: SkipIcon, systemImage: 'forward.end' },
  unskip: { label: 'Unskip exercise', icon: SkipIcon, systemImage: 'arrow.uturn.backward' },
  delete: { label: 'Delete exercise', icon: TrashIcon, systemImage: 'trash', destructive: true },
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

function formatSetCount(count: number, qualifier?: string): string {
  const noun = `set${count === 1 ? '' : 's'}`;
  return qualifier === undefined ? `${count} ${noun}` : `${count} ${qualifier} ${noun}`;
}

/** The sheet's subtitle (08.7, "Меню упражнения"): `2 sets planned · 1 logged`. */
export function formatExerciseMenuSubtitle(plannedSetCount: number, loggedSetCount: number) {
  return `${formatSetCount(plannedSetCount)} planned · ${loggedSetCount} logged`;
}

/**
 * The Delete exercise confirmation's message (05, "Удалить упражнение"): it names what goes with
 * the exercise — its logged sets. By the app's own logic there are never none here (Artem,
 * 29.09.2026), so there is no wording for none.
 */
export function formatDeleteExerciseWarning(loggedSetCount: number): string {
  return `Delete exercise with ${formatSetCount(loggedSetCount, 'logged')}?`;
}

/**
 * The Skip exercise confirmation's message (05, "Пропустить упражнение"): it names what the skip
 * takes — the sets not logged yet. Logged sets stay either way. By the app's own logic there are
 * never none left here (Artem, 29.09.2026), so there is no wording for none.
 */
export function formatSkipExerciseWarning(plannedSetCount: number, loggedSetCount: number) {
  const unlogged = plannedSetCount - loggedSetCount;
  return `Skip the exercise with ${formatSetCount(unlogged, 'unlogged')}?`;
}

/**
 * The Replace exercise danger confirmation's message (05, "Заменить упражнение"), shown before the
 * picker opens and only when the exercise has logged sets: they're deleted by the swap.
 */
export function formatReplaceExerciseWarning(exerciseName: string, loggedSetCount: number) {
  return `The ${formatSetCount(loggedSetCount)} logged for ${exerciseName} will be deleted.`;
}


/**
 * An exercise's menu as `ActionMenu` takes it: the rows above, each carrying the handler the card
 * was given for it. A row that isn't available keeps its place and its reason — the menu disables
 * it rather than hiding it, so the reason is what explains the gap.
 */
export function workoutExerciseMenuActions(
  actions: WorkoutExerciseActions,
  onAction: (item: ExerciseMenuItem) => void,
): ActionMenuItem[] {
  return exerciseMenuRows(actions).map(({ item, disabledReason }) => ({
    key: item,
    ...EXERCISE_MENU_ACTIONS[item],
    disabledReason,
    onPress: () => onAction(item),
  }));
}
