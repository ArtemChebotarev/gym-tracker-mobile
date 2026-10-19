// Pure helpers behind an exercise card's `⋯` menu (08.7, "Меню упражнения") — see the code-style
// skill. The menu itself is `ActionMenu` (117), rendered by components/ExerciseCardFrame.tsx;
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
import type {
  RoundExerciseActions,
  SetExerciseActions,
  WorkoutExercise,
  WorkoutExerciseActions,
} from '@usecases/workoutSession';

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
  addRound: { label: 'Add round', icon: PlusIcon, systemImage: 'plus' },
  removeLastRound: { label: 'Remove last round', icon: MinusIcon, systemImage: 'minus' },
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

function menuRow(item: ExerciseMenuItem, available: boolean, reason: string): ExerciseMenuRow {
  return available ? { item } : { item, disabledReason: reason };
}

/**
 * The rows of an exercise's menu, in the 08.7 order: Replace, then the type's own rows
 * (`typeMenuRows`), then what every type has. The moves stay listed when they're not available,
 * disabled with the reason (`Already first`, `Already last`); Skip and Unskip take turns in one
 * place. Replace, Skip and Delete are always available, logged sets or not — 088 works all of it
 * out from the exercise.
 */
export function exerciseMenuRows(
  actions: WorkoutExerciseActions,
  typeRows: readonly ExerciseMenuRow[],
): ExerciseMenuRow[] {
  return [
    { item: 'replace' },
    ...typeRows,
    menuRow('moveUp', actions.canMoveUp, 'Already first'),
    menuRow('moveDown', actions.canMoveDown, 'Already last'),
    { item: actions.canUnskip ? 'unskip' : 'skip' },
    { item: 'delete' },
  ];
}

/**
 * The set rows' own menu rows: Add set, always available, and Remove last set, which stays listed
 * with a single row, disabled with `Only one set`.
 */
export function setMenuRows(actions: SetExerciseActions): ExerciseMenuRow[] {
  return [{ item: 'addSet' }, menuRow('removeLastSet', actions.canRemoveLastSet, 'Only one set')];
}

/**
 * An interval card's own menu rows (GT-91; 10.1, "Меню ⋯ — как у силовых"): Add round, always
 * available, and Remove last round, which stays listed with a single round, disabled with
 * `Only one round`.
 */
export function roundMenuRows(actions: RoundExerciseActions): ExerciseMenuRow[] {
  return [
    { item: 'addRound' },
    menuRow('removeLastRound', actions.canRemoveLastRound, 'Only one round'),
  ];
}

/**
 * The rows a card's type puts into its menu: a card of set rows Add set and Remove last set, an
 * interval card Add round and Remove last round.
 */
export function typeMenuRows(exercise: WorkoutExercise): ExerciseMenuRow[] {
  return exercise.type === 'interval'
    ? roundMenuRows(exercise.actions)
    : setMenuRows(exercise.actions);
}

/**
 * What an exercise has planned and logged, in its own unit — sets, or an interval's rounds. The
 * menu's subtitle and the Skip / Delete / Replace confirmations count in it.
 */
export type ExerciseLogCounts = { unit: 'set' | 'round'; planned: number; logged: number };

export function exerciseLogCounts(exercise: WorkoutExercise): ExerciseLogCounts {
  return exercise.type === 'interval'
    ? { unit: 'round', planned: exercise.plannedRoundCount, logged: exercise.loggedRoundCount }
    : { unit: 'set', planned: exercise.plannedSetCount, logged: exercise.loggedSetCount };
}

function formatCount(count: number, unit: ExerciseLogCounts['unit'], qualifier?: string): string {
  const noun = `${unit}${count === 1 ? '' : 's'}`;
  return qualifier === undefined ? `${count} ${noun}` : `${count} ${qualifier} ${noun}`;
}

/** The sheet's subtitle (08.7, "Меню упражнения"): `2 sets planned · 1 logged`. */
export function formatExerciseMenuSubtitle({ unit, planned, logged }: ExerciseLogCounts) {
  return `${formatCount(planned, unit)} planned · ${logged} logged`;
}

/**
 * The Delete exercise confirmation's message (05, "Удалить упражнение"): it names what goes with
 * the exercise — its logged sets. By the app's own logic there are never none here (Artem,
 * 29.09.2026), so there is no wording for none.
 */
export function formatDeleteExerciseWarning({ unit, logged }: ExerciseLogCounts): string {
  return `Delete exercise with ${formatCount(logged, unit, 'logged')}?`;
}

/**
 * The Skip exercise confirmation's message (05, "Пропустить упражнение"): it names what the skip
 * takes — the sets not logged yet. Logged sets stay either way. By the app's own logic there are
 * never none left here (Artem, 29.09.2026), so there is no wording for none.
 */
export function formatSkipExerciseWarning({ unit, planned, logged }: ExerciseLogCounts) {
  return `Skip the exercise with ${formatCount(planned - logged, unit, 'unlogged')}?`;
}

/**
 * The Replace exercise danger confirmation's message (05, "Заменить упражнение"), shown before the
 * picker opens and only when the exercise has logged sets: they're deleted by the swap.
 */
export function formatReplaceExerciseWarning(
  exerciseName: string,
  { unit, logged }: ExerciseLogCounts,
) {
  return `The ${formatCount(logged, unit)} logged for ${exerciseName} will be deleted.`;
}

/**
 * An exercise's menu as `ActionMenu` takes it: the rows above, each carrying the handler the card
 * was given for it. A row that isn't available keeps its place and its reason — the menu disables
 * it rather than hiding it, so the reason is what explains the gap.
 */
export function workoutExerciseMenuActions(
  exercise: WorkoutExercise,
  onAction: (item: ExerciseMenuItem) => void,
): ActionMenuItem[] {
  return exerciseMenuRows(exercise.actions, typeMenuRows(exercise)).map(
    ({ item, disabledReason }) => ({
      key: item,
      ...EXERCISE_MENU_ACTIONS[item],
      disabledReason,
      onPress: () => onAction(item),
    }),
  );
}
