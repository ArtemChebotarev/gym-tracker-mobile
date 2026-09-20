// The Exercise screen's `⋯` menu — 08.6 · Библиотека упражнений, "Меню и действия" (task 065).
// One ActionRow per action the exercise's `source` allows: a catalog exercise can only be hidden,
// a custom one can also be edited. Which actions those are is the domain's call
// (`exerciseOverviewActions`), not this sheet's — it renders the list it's handed.
//
// There is no Delete, here or anywhere (08.6: "Удаления в интерфейсе нет вообще") — an exercise
// with references is never deleted (02 · Domain Model). `Hide` is the closest thing, and it asks
// first: the exercise keeps its whole history but drops out of every picker, and nothing in the
// app brings it back today (08.6, "Чего здесь нет": a Show-hidden screen is an open question).
//
// Presentational: the actions and what each one does come in as props from
// app/exercise/[id]/index.tsx.

import { Alert } from 'react-native';

import { ActionRow } from '@design/components/ActionRow';
import { BottomSheet } from '@design/components/BottomSheet';
import { EditIcon } from '@design/icons/EditIcon';
import { HideIcon } from '@design/icons/HideIcon';
import type { IconComponent } from '@design/icons/IconFrame';
import type { ExerciseOverviewAction } from '@domain/exerciseOverview';

export type ExerciseMenuSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The exercise's name — the sheet's title. */
  exerciseName: string;
  /** What this exercise's source allows (08.6, "Меню и действия"). */
  actions: readonly ExerciseOverviewAction[];
  /** Opens the Edit exercise sheet (08.6, "New exercise — лист"). Custom exercises only. */
  onEdit: () => void;
  /** Hides the exercise — after the confirmation below. */
  onHide: () => void;
};

const EXERCISE_MENU_ACTIONS: Record<
  ExerciseOverviewAction,
  { label: string; icon: IconComponent }
> = {
  edit: { label: 'Edit', icon: EditIcon },
  hide: { label: 'Hide', icon: HideIcon },
};

export function ExerciseMenuSheet({
  visible,
  onClose,
  exerciseName,
  actions,
  onEdit,
  onHide,
}: ExerciseMenuSheetProps) {
  function handlePress(action: ExerciseOverviewAction) {
    onClose();
    if (action === 'edit') {
      onEdit();
      return;
    }
    Alert.alert(
      'Hide exercise?',
      `${exerciseName} will disappear from the library and from every exercise picker. Everything you have logged for it stays in your history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Hide', style: 'destructive', onPress: onHide },
      ],
    );
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={exerciseName} presentation="overlay">
      {actions.map((action) => (
        <ActionRow
          key={action}
          icon={EXERCISE_MENU_ACTIONS[action].icon}
          label={EXERCISE_MENU_ACTIONS[action].label}
          onPress={() => handlePress(action)}
        />
      ))}
    </BottomSheet>
  );
}
