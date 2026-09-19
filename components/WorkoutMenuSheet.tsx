// Header menu sheet — 08.7 · Тренировка, "Лист «Меню шапки»" (task 096). Opened by the workout
// header's `⋯`: the title `Week N Day N`, the mesocycle's name under it, and one ActionRow per
// action with its icon on the left. Live sessions get Add exercise and — with no set logged yet —
// Skip workout; every mode gets Rename mesocycle, Mesocycle history, and the danger Stop mesocycle
// (`workoutMenuItems` picks them from the model's actions).
//
// Every action closes the sheet first. Skip workout can't be undone, so it asks for confirmation
// here, the same way the Mesocycles tab gates Delete, and calls `onSkipWorkout` only once accepted.
// The sheet is an `overlay` BottomSheet rather than a native <Modal>: that confirmation is raised
// the moment the menu closes, and an iOS alert presented while a native modal is still dismissing
// can be swallowed with it; Add exercise likewise opens the exercise picker right away, whose
// Filters sheet then needs to be the only native modal (08.5).
//
// Presentational: the model and what each action does come in as props from the Today tab
// (app/(tabs)/index.tsx). JSX/rendering only — pure helpers live in WorkoutMenuSheetLogic.ts, per the
// code-style skill; ActionRow carries the rows' looks, so there are no styles of its own.

import { Alert } from 'react-native';

import { ActionRow } from '@design/components/ActionRow';
import { BottomSheet } from '@design/components/BottomSheet';
import type { WorkoutSessionModel } from '@usecases/workoutSession';

import {
  formatWorkoutMenuTitle,
  WORKOUT_MENU_ACTIONS,
  type WorkoutMenuItem,
  workoutMenuItems,
} from './WorkoutMenuSheetLogic';

export type WorkoutMenuSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The session the workout screen shows. */
  model: Pick<WorkoutSessionModel, 'header' | 'actions'> | undefined;
  /** Opens the exercise picker to add exercises to the session (048). */
  onAddExercise: () => void;
  /** Skips the session (049) — called only after the confirmation is accepted. */
  onSkipWorkout: () => void;
  onRenameMesocycle: () => void;
  onOpenMesocycleHistory: () => void;
  onStopMesocycle: () => void;
};

export function WorkoutMenuSheet({
  visible,
  onClose,
  model,
  onAddExercise,
  onSkipWorkout,
  onRenameMesocycle,
  onOpenMesocycleHistory,
  onStopMesocycle,
}: WorkoutMenuSheetProps) {
  const handlers: Record<WorkoutMenuItem, () => void> = {
    addExercise: onAddExercise,
    skipWorkout: () =>
      Alert.alert('Skip workout?', "It will be marked as skipped. This can't be undone.", [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', style: 'destructive', onPress: onSkipWorkout },
      ]),
    renameMesocycle: onRenameMesocycle,
    mesocycleHistory: onOpenMesocycleHistory,
    stopMesocycle: onStopMesocycle,
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={model ? formatWorkoutMenuTitle(model.header) : ''}
      subtitle={model?.header.mesocycleName}
      presentation="overlay"
    >
      {model &&
        workoutMenuItems(model.actions).map((item) => {
          const { label, icon, variant } = WORKOUT_MENU_ACTIONS[item];
          return (
            <ActionRow
              key={item}
              icon={icon}
              label={label}
              variant={variant}
              onPress={() => {
                onClose();
                handlers[item]();
              }}
            />
          );
        })}
    </BottomSheet>
  );
}
