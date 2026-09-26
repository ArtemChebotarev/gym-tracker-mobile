// Pure helpers behind the workout header's `⋯` menu (08.7, "Меню шапки") — see the code-style
// skill. The menu itself is `ActionMenu` (117), wired in components/WorkoutScreen.tsx; this only
// decides which actions a session offers and what each one looks like.

import type { ActionMenuItem } from '@design/components/ActionMenu';
import { EditIcon } from '@design/icons/EditIcon';
import { HistoryIcon } from '@design/icons/HistoryIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { PlusIcon } from '@design/icons/PlusIcon';
import { SkipIcon } from '@design/icons/SkipIcon';
import { StopIcon } from '@design/icons/StopIcon';
import type { SFSymbol } from 'sf-symbols-typescript';
import type { WorkoutHeader, WorkoutSessionActions } from '@usecases/workoutSession';

/** The header menu's actions (08.7, "Меню шапки"), in the order the menu lists them. */
export type WorkoutMenuItem =
  'addExercise' | 'skipWorkout' | 'renameMesocycle' | 'mesocycleHistory' | 'stopMesocycle';

/**
 * How each action reads. `icon` is drawn by the fallback sheet off iOS and `systemImage` by the
 * native menu on it — the two icon sets don't overlap, so an action names one of each.
 */
export const WORKOUT_MENU_ACTIONS: Record<
  WorkoutMenuItem,
  { label: string; icon: IconComponent; systemImage: SFSymbol; destructive?: boolean }
> = {
  addExercise: { label: 'Add exercise', icon: PlusIcon, systemImage: 'plus' },
  skipWorkout: { label: 'Skip workout', icon: SkipIcon, systemImage: 'forward.end' },
  renameMesocycle: { label: 'Rename mesocycle', icon: EditIcon, systemImage: 'pencil' },
  mesocycleHistory: {
    label: 'Mesocycle history',
    icon: HistoryIcon,
    systemImage: 'clock.arrow.circlepath',
  },
  stopMesocycle: {
    label: 'Stop mesocycle',
    icon: StopIcon,
    systemImage: 'stop.circle',
    destructive: true,
  },
};

/**
 * The actions the header menu lists for a session. Rename and Mesocycle history are there in every
 * mode; Add exercise and Skip workout only when the model allows them — live, and for Skip while an
 * exercise is still unfinished (088 works both out, including that a deload session takes no
 * additions) — and Stop mesocycle while the block is still active (052). An action that isn't
 * allowed is left out rather than shown disabled.
 *
 * "Every mode" means every mode that has this menu: a day of a block that has already been
 * finished or stopped opens in history, where the header carries no `⋯` at all (08.9, task 128).
 */
export function workoutMenuItems(actions: WorkoutSessionActions): WorkoutMenuItem[] {
  const items: WorkoutMenuItem[] = [];
  if (actions.canAddExercise) {
    items.push('addExercise');
  }
  if (actions.canSkipWorkout) {
    items.push('skipWorkout');
  }
  items.push('renameMesocycle', 'mesocycleHistory');
  if (actions.canStopMesocycle) {
    items.push('stopMesocycle');
  }
  return items;
}

/** Those actions as the menu takes them, each carrying the handler the screen supplies for it. */
export function workoutMenuActions(
  actions: WorkoutSessionActions,
  handlers: Record<WorkoutMenuItem, () => void>,
): ActionMenuItem[] {
  return workoutMenuItems(actions).map((item) => ({
    key: item,
    ...WORKOUT_MENU_ACTIONS[item],
    onPress: handlers[item],
  }));
}

/**
 * The Skip workout confirmation's message (05, "Пропустить тренировку"): every exercise not yet
 * completed is skipped, so rows left unlogged in them — and anything typed there — are gone.
 */
export const SKIP_WORKOUT_WARNING =
  "Exercises you haven't finished will be skipped, and anything not logged in them will be lost. This can't be undone.";

/** The fallback sheet's title (08.7, "Меню шапки"): `Week 6 Day 2`. */
export function formatWorkoutMenuTitle(
  header: Pick<WorkoutHeader, 'weekNumber' | 'dayNumber'>,
): string {
  return `Week ${header.weekNumber} Day ${header.dayNumber}`;
}
