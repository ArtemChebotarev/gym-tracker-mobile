// New/Edit exercise sheet — see 08.6 · Библиотека упражнений, "New exercise — лист", and its
// mockup 03-new-exercise.html.
//
// Fully controlled, the same way ExerciseFiltersSheet.tsx is: the caller owns the in-progress
// field values (seeding them when the sheet opens, e.g. from a prefilled search or from the
// exercise being edited — see app/(tabs)/library.tsx) and submission (calling the
// createCustomExercise / updateCustomExercise usecase and closing the sheet). `exercise` selects
// the mode — omitted means "New exercise", given means "Edit exercise" and gates the catalog
// guard below — but does not itself seed `values`; that stays the caller's job, the same way
// ExerciseFiltersSheet's caller seeds `filters` into `draftFilters` before opening.
//
// Equipment is a field on the domain model (domain/catalog.ts's `Exercise.equipment`) that 08.6
// documents as UI-deferred everywhere else (the catalog seed data has it, but neither this sheet
// nor the Filters sheet exposed it). This sheet is the one place that now fills it in — see the
// Product Spec's "New exercise — лист" section for the decision. Unlike Name and Muscle group,
// it's optional and never gates the Create/Save button (08.6 only requires "два обязательных
// поля — название и группа мышц").
//
// JSX/rendering only — styles live in ExerciseFormSheetStyles.ts and pure helpers in
// ExerciseFormSheetLogic.ts, per the code-style skill.

import { View } from 'react-native';

import { EQUIPMENT_OPTIONS, MUSCLE_GROUPS, type Equipment, type Exercise, type MuscleGroup } from '@domain/catalog';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { Dropdown } from '@design/components/Dropdown';
import { TextField } from '@design/components/TextField';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import { canSubmitExerciseForm, isExerciseEditableInSheet } from './ExerciseFormSheetLogic';
import { styles } from './ExerciseFormSheetStyles';

export type ExerciseFormValues = {
  name: string;
  muscleGroup: MuscleGroup | undefined;
  equipment: Equipment | undefined;
};

export const EMPTY_EXERCISE_FORM_VALUES: ExerciseFormValues = {
  name: '',
  muscleGroup: undefined,
  equipment: undefined,
};

export type ExerciseFormSubmitInput = {
  name: string;
  muscleGroup: MuscleGroup;
  equipment?: Equipment;
};

export type ExerciseFormSheetProps = {
  visible: boolean;
  /** Omitted for "New exercise"; a custom exercise to edit for "Edit exercise". */
  exercise?: Exercise;
  values: ExerciseFormValues;
  onChangeValues: (values: ExerciseFormValues) => void;
  onSubmit: (input: ExerciseFormSubmitInput) => void;
  onClose: () => void;
};

const MUSCLE_GROUP_OPTIONS = MUSCLE_GROUPS.map((muscleGroup) => ({
  value: muscleGroup,
  label: getMuscleGroupLabel(muscleGroup),
}));

const EQUIPMENT_DROPDOWN_OPTIONS = EQUIPMENT_OPTIONS.map((equipment) => ({
  value: equipment,
  label: getEquipmentLabel(equipment),
}));

export function ExerciseFormSheet({
  visible,
  exercise,
  values,
  onChangeValues,
  onSubmit,
  onClose,
}: ExerciseFormSheetProps) {
  const isEditMode = exercise !== undefined;
  const canOpen = exercise === undefined || isExerciseEditableInSheet(exercise);

  if (!canOpen) {
    return null;
  }

  function handleSubmit() {
    if (values.muscleGroup === undefined) {
      return;
    }
    onSubmit({ name: values.name.trim(), muscleGroup: values.muscleGroup, equipment: values.equipment });
  }

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isEditMode ? 'Edit exercise' : 'New exercise'}
      footer={
        <View style={styles.buttonRow}>
          <View style={styles.cancelButton}>
            <Button label="Cancel" variant="secondary" onPress={onClose} />
          </View>
          <View style={styles.confirmButton}>
            <Button
              label={isEditMode ? 'Save' : 'Create'}
              onPress={handleSubmit}
              disabled={!canSubmitExerciseForm(values.name, values.muscleGroup)}
            />
          </View>
        </View>
      }
    >
      <View style={styles.field}>
        <TextField
          label="Name"
          value={values.name}
          onChangeText={(name) => onChangeValues({ ...values, name })}
          placeholder="e.g. Chest supported row"
        />
      </View>

      <View style={styles.field}>
        <Dropdown
          label="Muscle group"
          options={MUSCLE_GROUP_OPTIONS}
          value={values.muscleGroup}
          onChange={(muscleGroup) => onChangeValues({ ...values, muscleGroup: muscleGroup as MuscleGroup })}
          placeholder="Choose muscle group"
        />
      </View>

      <View style={styles.field}>
        <Dropdown
          label="Equipment"
          options={EQUIPMENT_DROPDOWN_OPTIONS}
          value={values.equipment}
          onChange={(equipment) => onChangeValues({ ...values, equipment: equipment as Equipment })}
          placeholder="Choose equipment"
        />
      </View>
    </BottomSheet>
  );
}
