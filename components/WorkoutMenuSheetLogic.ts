// Pure helpers behind components/WorkoutMenuSheet.tsx — see the code-style skill.

import type { ActionRowVariant } from '@design/components/ActionRow';
import { EditIcon } from '@design/icons/EditIcon';
import { HistoryIcon } from '@design/icons/HistoryIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import { PlusIcon } from '@design/icons/PlusIcon';
import { SkipIcon } from '@design/icons/SkipIcon';
import { StopIcon } from '@design/icons/StopIcon';
import type { WorkoutHeader, WorkoutSessionActions } from '@usecases/workoutSession';

/** The header menu's actions (08.7, "Меню шапки"), in the order the sheet lists them. */
export type WorkoutMenuItem =
  'addExercise' | 'skipWorkout' | 'renameMesocycle' | 'mesocycleHistory' | 'stopMesocycle';

export const WORKOUT_MENU_ACTIONS: Record<
  WorkoutMenuItem,
  { label: string; icon: IconComponent; variant: ActionRowVariant }
> = {
  addExercise: { label: 'Add exercise', icon: PlusIcon, variant: 'default' },
  skipWorkout: { label: 'Skip workout', icon: SkipIcon, variant: 'default' },
  renameMesocycle: { label: 'Rename mesocycle', icon: EditIcon, variant: 'default' },
  mesocycleHistory: { label: 'Mesocycle history', icon: HistoryIcon, variant: 'default' },
  stopMesocycle: { label: 'Stop mesocycle', icon: StopIcon, variant: 'danger' },
};

/**
 * The actions the header menu lists for a session. Rename and Mesocycle history are there in every
 * mode; Add exercise and Skip workout only when the model allows them — live, and for Skip while an
 * exercise is still unfinished (088 works both out, including that a deload session takes no
 * additions) — and Stop mesocycle while the block is still active (052): a day of a block that has
 * already been finished or stopped opens read-only, and there is nothing left there to stop. An
 * action that isn't allowed is left out rather than shown disabled.
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

/**
 * The Skip workout confirmation's message (05, "Пропустить тренировку"): every exercise not yet
 * completed is skipped, so rows left unlogged in them — and anything typed there — are gone.
 */
export const SKIP_WORKOUT_WARNING =
  "Exercises you haven't finished will be skipped, and anything not logged in them will be lost. This can't be undone.";

/** The sheet's title (08.7, "Меню шапки"): `Week 6 Day 2`. */
export function formatWorkoutMenuTitle(
  header: Pick<WorkoutHeader, 'weekNumber' | 'dayNumber'>,
): string {
  return `Week ${header.weekNumber} Day ${header.dayNumber}`;
}
