// Exercise menu sheet — 08.7 · Тренировка, "Лист «Меню упражнения»" (task 097). Opened by an
// exercise card's `⋯` (live sessions only): the exercise's name, `N sets planned · M logged` under
// it, and one ActionRow per action — Replace exercise, Add set, Remove last set, Move up / Move
// down, Skip or Unskip exercise, and the danger Delete exercise. An action that isn't available
// right now stays listed, greyed out with the reason on the right (`exerciseMenuRows`).
//
// Every action closes the sheet first. Delete can't be undone, so it asks for a danger
// confirmation here — warning that logged sets go with it, if there are any — and calls
// `onCommand('delete')` only once accepted. Replace hands over to the exercise picker; the danger
// confirmation for logged sets comes after the pick, from the caller. The sheet is an `overlay`
// BottomSheet for the reasons WorkoutMenuSheet gives: an alert raised as it closes, and a picker
// with its own Filters modal opened right after.
//
// Presentational: the exercise and what each action does come in as props from the Today tab
// (app/(tabs)/index.tsx). JSX/rendering only — pure helpers live in
// WorkoutExerciseMenuSheetLogic.ts, per the code-style skill; ActionRow carries the rows' looks.

import { Alert } from 'react-native';

import { ActionRow } from '@design/components/ActionRow';
import { BottomSheet } from '@design/components/BottomSheet';
import type { ExerciseCommand } from '@state/useExerciseCommand';
import type { WorkoutExercise } from '@usecases/workoutSession';

import {
  EXERCISE_MENU_ACTIONS,
  exerciseMenuRows,
  formatDeleteExerciseWarning,
  formatExerciseMenuSubtitle,
} from './WorkoutExerciseMenuSheetLogic';

export type WorkoutExerciseMenuSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The exercise whose `⋯` was tapped. */
  exercise: WorkoutExercise | undefined;
  /** Opens the exercise picker to replace the exercise (047). */
  onReplace: () => void;
  /** Runs a one-tap action; `delete` only after its confirmation is accepted. */
  onCommand: (command: ExerciseCommand) => void;
};

export function WorkoutExerciseMenuSheet({
  visible,
  onClose,
  exercise,
  onReplace,
  onCommand,
}: WorkoutExerciseMenuSheetProps) {
  function confirmDelete(loggedSetCount: number) {
    Alert.alert('Delete exercise?', formatDeleteExerciseWarning(loggedSetCount), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onCommand('delete') },
    ]);
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={exercise?.name ?? ''}
      subtitle={
        exercise && formatExerciseMenuSubtitle(exercise.plannedSetCount, exercise.loggedSetCount)
      }
      presentation="overlay"
    >
      {exercise &&
        exerciseMenuRows(exercise.actions).map(({ item, disabledReason }) => {
          const { label, icon, variant } = EXERCISE_MENU_ACTIONS[item];
          return (
            <ActionRow
              key={item}
              icon={icon}
              label={label}
              variant={variant}
              disabledReason={disabledReason}
              onPress={() => {
                onClose();
                if (item === 'replace') {
                  onReplace();
                } else if (item === 'delete') {
                  confirmDelete(exercise.loggedSetCount);
                } else {
                  onCommand(item);
                }
              }}
            />
          );
        })}
    </BottomSheet>
  );
}
