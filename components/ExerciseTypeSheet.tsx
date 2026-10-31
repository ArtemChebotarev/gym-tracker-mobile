// The first step of creating an exercise: what kind of work it is (10.1 FR-11, canvas 4.1 "New
// exercise · pick type"). A sheet of one choice and Next — the fields of the chosen type follow on
// their own full-screen page (ExerciseCreateScreen), like the mesocycle editor's steps.
//
// Controlled: the caller owns the picked type.

import { EXERCISE_TYPES, type ExerciseType } from '@domain/catalog';
import { OptionSheet, type OptionSheetOption } from '@design/components/OptionSheet';
import { getExerciseTypeIcon } from '@design/exerciseTypeIcon';
import { getExerciseTypeDescription, getExerciseTypeLabel } from '@design/exerciseTypeLabel';

const OPTIONS: OptionSheetOption<ExerciseType>[] = EXERCISE_TYPES.map((type) => ({
  value: type,
  title: getExerciseTypeLabel(type),
  description: getExerciseTypeDescription(type),
  icon: getExerciseTypeIcon(type),
}));

export type ExerciseTypeSheetProps = {
  visible: boolean;
  type: ExerciseType;
  onChangeType: (type: ExerciseType) => void;
  onNext: () => void;
  onClose: () => void;
  /** False while closing for Next — the page opens at the same moment (see useHandoffSheet). */
  animated?: boolean;
};

export function ExerciseTypeSheet({
  visible,
  type,
  onChangeType,
  onNext,
  onClose,
  animated,
}: ExerciseTypeSheetProps) {
  return (
    <OptionSheet
      visible={visible}
      title="New exercise"
      subtitle="What kind of work is it? You can't change this after the first logged set."
      options={OPTIONS}
      selected={type}
      onSelect={onChangeType}
      onNext={onNext}
      onClose={onClose}
      animated={animated}
    />
  );
}
