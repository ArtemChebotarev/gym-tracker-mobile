// Pure helpers behind the Exercise screen's `⋯` menu (08.6 · Библиотека упражнений, "Меню и
// действия", task 065) — see the code-style skill. The menu itself is `ActionMenu` (117),
// rendered by components/ExerciseDetailScreen.tsx.
//
// Which actions an exercise offers is the domain's call (`exerciseOverviewActions`), not this
// file's: a catalog exercise can only be hidden, a custom one can also be edited. There is no
// Delete anywhere (08.6: "Удаления в интерфейсе нет вообще") — an exercise with references is
// never deleted (02 · Domain Model), and Hide is the closest thing.

import type { ActionMenuItem } from '@design/components/ActionMenu';
import { EditIcon } from '@design/icons/EditIcon';
import { HideIcon } from '@design/icons/HideIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import type { ExerciseOverviewAction } from '@domain/exerciseOverview';
import type { SFSymbol } from 'sf-symbols-typescript';

/**
 * How each action reads. `icon` is drawn by the fallback sheet off iOS and `systemImage` by the
 * native menu on it — the two icon sets don't overlap, so an action names one of each.
 *
 * Hide isn't `destructive`: nothing is thrown away, the exercise keeps its whole history and only
 * drops out of the pickers. The confirmation is what carries the weight, not a red row.
 */
export const EXERCISE_OVERVIEW_MENU_ACTIONS: Record<
  ExerciseOverviewAction,
  { label: string; icon: IconComponent; systemImage: SFSymbol }
> = {
  edit: { label: 'Edit', icon: EditIcon, systemImage: 'pencil' },
  hide: { label: 'Hide', icon: HideIcon, systemImage: 'eye.slash' },
};

/** Those actions as the menu takes them, each carrying the handler the screen supplies for it. */
export function exerciseOverviewMenuActions(
  actions: readonly ExerciseOverviewAction[],
  onAction: (action: ExerciseOverviewAction) => void,
): ActionMenuItem[] {
  return actions.map((action) => ({
    key: action,
    ...EXERCISE_OVERVIEW_MENU_ACTIONS[action],
    onPress: () => onAction(action),
  }));
}

/**
 * The Hide confirmation's message (08.6): the exercise disappears from the library and from every
 * picker, but everything logged for it stays — and nothing in the app brings it back today, which
 * is why it asks at all.
 */
export function formatHideExerciseWarning(exerciseName: string): string {
  return `${exerciseName} will disappear from the library and from every exercise picker. Everything you have logged for it stays in your history.`;
}
