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

import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  EQUIPMENT_OPTIONS,
  EXERCISE_TYPES,
  FULL_BODY,
  MUSCLE_GROUPS,
  type Equipment,
  type Exercise,
  type ExerciseType,
  type MuscleGroup,
} from '@domain/catalog';
import type { ExerciseConfig } from '@domain/exerciseConfig';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { Dropdown } from '@design/components/Dropdown';
import { ListRow } from '@design/components/ListRow';
import { TextField } from '@design/components/TextField';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { getExerciseTypeDescription, getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { getCategoryColor, getMuscleGroupCategory } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import { ExerciseConfigFields } from './ExerciseConfigFields';
import {
  canSubmitExerciseForm,
  isExerciseEditableInSheet,
  valuesForType,
} from './ExerciseFormSheetLogic';
import { styles } from './ExerciseFormSheetStyles';

export type ExerciseFormValues = {
  name: string;
  muscleGroup: MuscleGroup | undefined;
  equipment: Equipment | undefined;
  /** What the exercise is (10.1 FR-1). Picked in the sheet's first step when creating. */
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
  /** Omitted for "New exercise"; a custom exercise to edit for "Edit exercise". */
  exercise?: Exercise;
  values: ExerciseFormValues;
  onChangeValues: (values: ExerciseFormValues) => void;
  onSubmit: (input: ExerciseFormSubmitInput) => void;
  onClose: () => void;
};

// Carries each muscle group's family dot color (03-new-exercise.html: a colored dot per option,
// the same family colors ExerciseFiltersSheet's muscle-group chips already use), unlike Equipment
// below which has no color semantics.
const MUSCLE_GROUP_OPTIONS = MUSCLE_GROUPS.map((muscleGroup) => {
  const category = getMuscleGroupCategory(muscleGroup);
  return {
    value: muscleGroup,
    label: getMuscleGroupLabel(muscleGroup),
    dotColor: category !== undefined ? getCategoryColor(category) : undefined,
  };
});

// A non-strength exercise may have no group (10.1 FR-1) — stored as `fullBody`, shown as "None".
const NO_GROUP_OPTION = { value: FULL_BODY, label: 'None', dotColor: undefined };
const NON_STRENGTH_MUSCLE_GROUP_OPTIONS = [NO_GROUP_OPTION, ...MUSCLE_GROUP_OPTIONS];

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
  // Creating starts by choosing the type (10.1 FR-11: "Выбор типа — первый шаг шторки"); editing
  // goes straight to the fields, the type being what the exercise already is.
  const [isPickingType, setIsPickingType] = useState(!isEditMode);

  // Each opening starts over from the first step. Adjusting state during render on a change of
  // `visible`, rather than in an effect, so the sheet never paints one frame of the old step.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setIsPickingType(!isEditMode);
    }
  }

  if (!canOpen) {
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

  if (isPickingType) {
    return (
      <BottomSheet
        visible={visible}
        onClose={onClose}
        title="New exercise"
        subtitle="What kind of work is it? You can't change this after the first logged set."
        footer={
          <View style={styles.buttonRow}>
            <Button label="Cancel" variant="secondary" onPress={onClose} />
          </View>
        }
      >
        <View>
          {EXERCISE_TYPES.map((type) => (
            <ListRow
              key={type}
              title={getExerciseTypeLabel(type)}
              subtitle={getExerciseTypeDescription(type)}
              trailing={{ type: 'chevron' }}
              onPress={() => {
                onChangeValues(valuesForType(values, type));
                setIsPickingType(false);
              }}
            />
          ))}
        </View>
      </BottomSheet>
    );
  }

  const isStrength = values.type === 'strength';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={isEditMode ? 'Edit exercise' : 'New exercise'}
      subtitle={getExerciseTypeLabel(values.type)}
      footer={
        <View style={styles.buttonRow}>
          <View style={styles.cancelButton}>
            {isEditMode ? (
              <Button label="Cancel" variant="secondary" onPress={onClose} />
            ) : (
              <Button label="Back" variant="secondary" onPress={() => setIsPickingType(true)} />
            )}
          </View>
          <View style={styles.confirmButton}>
            <Button
              label={isEditMode ? 'Save' : 'Create exercise'}
              onPress={handleSubmit}
              disabled={!canSubmitExerciseForm(values.name, values.muscleGroup, values.type)}
            />
          </View>
        </View>
      }
    >
      <View style={styles.fields}>
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
            label="Equipment"
            options={EQUIPMENT_DROPDOWN_OPTIONS}
            value={values.equipment}
            onChange={(equipment) => onChangeValues({ ...values, equipment: equipment as Equipment })}
            placeholder="Choose equipment"
          />
        </View>
        <View style={styles.field}>
          <Dropdown
            label="Muscle group"
            options={isStrength ? MUSCLE_GROUP_OPTIONS : NON_STRENGTH_MUSCLE_GROUP_OPTIONS}
            value={values.muscleGroup}
            onChange={(muscleGroup) => onChangeValues({ ...values, muscleGroup: muscleGroup as MuscleGroup })}
            placeholder="Choose muscle group"
          />
          {!isStrength && (
            <Text style={styles.hint}>
              Optional. Without one, it sits under {getExerciseTypeLabel(values.type)} in the library.
            </Text>
          )}
        </View>

        {values.config !== undefined && (
          <ExerciseConfigFields
            config={values.config}
            onChange={(config) => onChangeValues({ ...values, config })}
          />
        )}
      </View>
    </BottomSheet>
  );
}
