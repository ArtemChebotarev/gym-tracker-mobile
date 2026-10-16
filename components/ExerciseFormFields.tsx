// The fields of an exercise form — name, equipment, muscle group and the type's own config
// (10.1 FR-1). Shared by the full-screen New exercise and Edit exercise pages, so the two
// can never offer different fields. Controlled, like the page that holds it.
//
// JSX/rendering only — styles live in ExerciseFormStyles.ts, helpers in
// ExerciseFormLogic.ts.

import { View } from 'react-native';

import {
  EQUIPMENT_OPTIONS,
  FULL_BODY,
  MUSCLE_GROUPS,
  type Equipment,
  type MuscleGroup,
} from '@domain/catalog';
import { Dropdown } from '@design/components/Dropdown';
import { TextField } from '@design/components/TextField';
import { getEquipmentLabel } from '@design/equipmentLabel';
import { getCategoryColor, getMuscleGroupCategory } from '@design/muscleGroupColor';
import { getMuscleGroupLabel } from '@design/muscleGroupLabel';

import { ExerciseConfigFields } from './ExerciseConfigFields';
import type { ExerciseFormValues } from './ExerciseFormValues';
import { styles } from './ExerciseFormStyles';

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

// A non-strength exercise may have no group (10.1 FR-1) — stored as `fullBody`, and called by its
// own label ("Full body") here as everywhere else, not given a second name for the same value.
const NO_GROUP_OPTION = {
  value: FULL_BODY,
  label: getMuscleGroupLabel(FULL_BODY),
  dotColor: undefined,
};
const NON_STRENGTH_MUSCLE_GROUP_OPTIONS = [NO_GROUP_OPTION, ...MUSCLE_GROUP_OPTIONS];

const EQUIPMENT_DROPDOWN_OPTIONS = EQUIPMENT_OPTIONS.map((equipment) => ({
  value: equipment,
  label: getEquipmentLabel(equipment),
}));

export type ExerciseFormFieldsProps = {
  values: ExerciseFormValues;
  onChangeValues: (values: ExerciseFormValues) => void;
};

export function ExerciseFormFields({ values, onChangeValues }: ExerciseFormFieldsProps) {
  const isStrength = values.type === 'strength';

  return (
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
          onChange={(muscleGroup) =>
            onChangeValues({ ...values, muscleGroup: muscleGroup as MuscleGroup })
          }
          placeholder="Choose muscle group"
        />
      </View>

      {values.config !== undefined && (
        <ExerciseConfigFields
          config={values.config}
          onChange={(config) => onChangeValues({ ...values, config })}
        />
      )}
    </View>
  );
}
