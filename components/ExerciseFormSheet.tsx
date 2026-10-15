// Edit exercise sheet — see 08.6 · Библиотека упражнений and its mockup 03-new-exercise.html.
// Creating an exercise is not here: it is the type sheet followed by the full-screen
// ExerciseCreateScreen (10.1 FR-11), which share the fields in ExerciseFormFields.
//
// Fully controlled, the same way ExerciseFiltersSheet.tsx is: the caller owns the in-progress
// field values (seeding them from the exercise being edited — see app/exercise/[id]/index.tsx)
// and submission (calling the updateCustomExercise usecase and closing the sheet). A catalog
// exercise cannot be opened here (08.6).
//
// JSX/rendering only — styles live in ExerciseFormSheetStyles.ts and pure helpers in
// ExerciseFormSheetLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import type { Equipment, Exercise, ExerciseType, MuscleGroup } from '@domain/catalog';
import type { ExerciseConfig } from '@domain/exerciseConfig';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { fieldStyles } from '@design/components/fieldStyles';
import { getExerciseTypeLabel } from '@design/exerciseTypeLabel';

import { ExerciseFormFields } from './ExerciseFormFields';
import { ExerciseProgressionFields } from './ExerciseProgressionFields';
import { canSubmitExerciseForm, isExerciseEditableInSheet } from './ExerciseFormSheetLogic';
import { styles } from './ExerciseFormSheetStyles';

export type ExerciseFormValues = {
  name: string;
  muscleGroup: MuscleGroup | undefined;
  equipment: Equipment | undefined;
  /** What the exercise is (10.1 FR-1). Picked on the type sheet when creating. */
  type: ExerciseType;
  /** The type's defaults (FR-9); `undefined` exactly when `type` is `strength`. */
  config: ExerciseConfig | undefined;
};

export const EMPTY_EXERCISE_FORM_VALUES: ExerciseFormValues = {
  name: '',
  muscleGroup: undefined,
  equipment: undefined,
  type: 'strength',
  config: undefined,
};

export type ExerciseFormSubmitInput = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: Equipment;
  type: ExerciseType;
  config?: ExerciseConfig;
};

export type ExerciseFormSheetProps = {
  visible: boolean;
  /** The custom exercise being edited. */
  exercise: Exercise;
  values: ExerciseFormValues;
  onChangeValues: (values: ExerciseFormValues) => void;
  onSubmit: (input: ExerciseFormSubmitInput) => void;
  onClose: () => void;
};

export function ExerciseFormSheet({
  visible,
  exercise,
  values,
  onChangeValues,
  onSubmit,
  onClose,
}: ExerciseFormSheetProps) {
  if (!isExerciseEditableInSheet(exercise)) {
    return null;
  }

  function handleSubmit() {
    if (values.muscleGroup === undefined) {
      return;
    }
    onSubmit({
      name: values.name.trim(),
      muscleGroup: values.muscleGroup,
      equipment: values.equipment,
      type: values.type,
      config: values.config,
    });
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Edit exercise"
      subtitle={getExerciseTypeLabel(values.type)}
      footer={
        <View style={styles.buttonRow}>
          <View style={styles.cancelButton}>
            <Button label="Cancel" variant="secondary" onPress={onClose} />
          </View>
          <View style={styles.confirmButton}>
            <Button
              label="Save"
              onPress={handleSubmit}
              disabled={!canSubmitExerciseForm(values.name, values.muscleGroup, values.type)}
            />
          </View>
        </View>
      }
    >
      <ExerciseFormFields values={values} onChangeValues={onChangeValues} />
      {values.config?.type === 'interval' && (
        <View style={styles.progressionStep}>
          <Text style={fieldStyles.label}>Progression</Text>
          <ExerciseProgressionFields
            config={values.config}
            onChange={(config) => onChangeValues({ ...values, config })}
          />
        </View>
      )}
    </BottomSheet>
  );
}
