// The first step of creating an exercise: what kind of work it is (10.1 FR-11, canvas 4.1 "New
// exercise · pick type"). A sheet of one choice and Next — the fields of the chosen type follow on
// their own full-screen page (ExerciseCreateScreen), like the mesocycle editor's steps.
//
// Controlled: the caller owns the picked type.

import { View } from 'react-native';

import { EXERCISE_TYPES, type ExerciseType } from '@domain/catalog';
import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { OptionCard } from '@design/components/OptionCard';
import { getExerciseTypeIcon } from '@design/exerciseTypeIcon';
import { getExerciseTypeDescription, getExerciseTypeLabel } from '@design/exerciseTypeLabel';
import { COLORS, ICON_SIZES } from '@design/tokens';

import { styles } from './ExerciseFormSheetStyles';

export type ExerciseTypeSheetProps = {
  visible: boolean;
  type: ExerciseType;
  onChangeType: (type: ExerciseType) => void;
  onNext: () => void;
  onClose: () => void;
};

export function ExerciseTypeSheet({ visible, type, onChangeType, onNext, onClose }: ExerciseTypeSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="New exercise"
      subtitle="What kind of work is it? You can't change this after the first logged set."
      footer={
        <View style={styles.buttonRow}>
          <View style={styles.cancelButton}>
            <Button label="Cancel" variant="secondary" onPress={onClose} />
          </View>
          <View style={styles.confirmButton}>
            <Button label="Next" onPress={onNext} />
          </View>
        </View>
      }
    >
      <View style={styles.typeOptions} accessibilityRole="radiogroup">
        {EXERCISE_TYPES.map((option) => {
          const Icon = getExerciseTypeIcon(option);
          const selected = option === type;
          return (
            <OptionCard
              key={option}
              title={getExerciseTypeLabel(option)}
              description={getExerciseTypeDescription(option)}
              selected={selected}
              onPress={() => onChangeType(option)}
              icon={
                <Icon
                  size={ICON_SIZES['icon/button']}
                  color={selected ? COLORS.accent : COLORS['text/secondary']}
                />
              }
            />
          );
        })}
      </View>
    </BottomSheet>
  );
}
