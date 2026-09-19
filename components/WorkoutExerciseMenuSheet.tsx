// Exercise menu sheet — 08.7 · Тренировка, "Лист «Меню упражнения»" (task 097). Opened by an
// exercise card's `⋯` (live sessions only): the exercise's name, `N sets planned · M logged` under
// it, and one ActionRow per action — Replace exercise, Add set, Remove last set, Move up / Move
// down, Skip or Unskip exercise, and the danger Delete exercise. An action that isn't available
// right now stays listed, greyed out with the reason on the right (`exerciseMenuRows`).
//
// Every action closes the sheet first. Three of them ask first:
// - Delete — a danger confirmation, warning that logged sets go with it if there are any;
// - Skip — a confirmation saying what's skipped and what stays logged;
// - Replace — only with logged sets: a danger confirmation that the swap deletes them, before the
//   exercise picker opens (`onReplace`).
// The command runs only once its confirmation is accepted. The sheet is an `overlay`
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
  type ExerciseMenuItem,
  exerciseMenuRows,
  formatDeleteExerciseWarning,
  formatExerciseMenuSubtitle,
  formatReplaceExerciseWarning,
  formatSkipExerciseWarning,
} from './WorkoutExerciseMenuSheetLogic';

export type WorkoutExerciseMenuSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The exercise whose `⋯` was tapped. */
  exercise: WorkoutExercise | undefined;
  /** Opens the exercise picker to replace the exercise (047) — after the confirmation, if any. */
  onReplace: () => void;
  /** Runs a one-tap action; `delete` and `skip` only after their confirmation is accepted. */
  onCommand: (command: ExerciseCommand) => void;
};

export function WorkoutExerciseMenuSheet({
  visible,
  onClose,
  exercise,
  onReplace,
  onCommand,
}: WorkoutExerciseMenuSheetProps) {
  function confirm(
    title: string,
    message: string,
    action: { text: string; destructive: boolean; onPress: () => void },
  ) {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: action.text,
        style: action.destructive ? 'destructive' : 'default',
        onPress: action.onPress,
      },
    ]);
  }

  function handlePress(item: ExerciseMenuItem, target: WorkoutExercise) {
    onClose();
    switch (item) {
      case 'replace':
        if (!target.hasLoggedSets) {
          onReplace();
          return;
        }
        confirm(
          'Replace exercise?',
          formatReplaceExerciseWarning(target.name, target.loggedSetCount),
          { text: 'Replace', destructive: true, onPress: onReplace },
        );
        return;
      case 'skip':
        confirm(
          'Skip exercise?',
          formatSkipExerciseWarning(target.plannedSetCount, target.loggedSetCount),
          { text: 'Skip', destructive: false, onPress: () => onCommand('skip') },
        );
        return;
      case 'delete':
        confirm('Delete exercise?', formatDeleteExerciseWarning(target.loggedSetCount), {
          text: 'Delete',
          destructive: true,
          onPress: () => onCommand('delete'),
        });
        return;
      default:
        onCommand(item);
    }
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
              onPress={() => handlePress(item, exercise)}
            />
          );
        })}
    </BottomSheet>
  );
}
