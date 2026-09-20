// Body weight sheet — task 105 (05 · Workout Execution & Logging, "Ввод веса и повторов"). Asked
// once per mesocycle: its bodyweight exercises are loaded by your own weight, and without it their
// Weight column has nothing to put in front of you.
//
// It does not open by itself. The Weight field of a bodyweight exercise opens it while the block
// has no body weight yet, and that field is always on screen — so closing the sheet, by accident
// or on purpose, is never a dead end and never costs the workout (Artem's review: the first
// version popped up on opening the session and one stray tap on the backdrop retired the question
// for good).
//
// Fully controlled, like ExerciseFormSheet: the caller owns the in-progress text and the save.
// JSX/rendering only — styles live in BodyWeightSheetStyles.ts and pure helpers in
// BodyWeightSheetLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { TextField } from '@design/components/TextField';

import { parseBodyWeight } from './BodyWeightSheetLogic';
import { styles } from './BodyWeightSheetStyles';

export type BodyWeightSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChangeValue: (text: string) => void;
  /** Called with the parsed weight — only reachable once the field holds a positive number. */
  onSave: (bodyWeight: number) => void;
  /** The save is in flight — Save waits for it so a double tap can't repeat it. */
  isSaving: boolean;
};

export function BodyWeightSheet({
  visible,
  onClose,
  value,
  onChangeValue,
  onSave,
  isSaving,
}: BodyWeightSheetProps) {
  const bodyWeight = parseBodyWeight(value);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Your body weight"
      subtitle="Used for this mesocycle's bodyweight exercises"
      footer={
        <Button
          label="Save"
          onPress={() => {
            if (bodyWeight !== null) {
              onSave(bodyWeight);
            }
          }}
          disabled={bodyWeight === null || isSaving}
        />
      }
    >
      <View style={styles.content}>
        <TextField
          label="Body weight, kg"
          value={value}
          onChangeText={onChangeValue}
          placeholder="80"
        />
        <Text style={styles.note}>
          You can change it later by editing the weight of any bodyweight exercise.
        </Text>
      </View>
    </BottomSheet>
  );
}
