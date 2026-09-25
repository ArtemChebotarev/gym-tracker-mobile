// Rename mesocycle — task 087 (05 · Workout Execution & Logging, "Переименовать мезоцикл";
// 08.7's header menu, 096: "лист с `TextField` и `Save`"). Opened by the header menu's `Rename
// mesocycle`, which only closes the menu; the block is renamed from here.
//
// The lightest of the three mesocycle sheets: one field, one Save, no warning — a name is a label
// and nothing about the block's plan or history moves with it, so there is nothing to confirm.
// Save waits for a non-empty field (`isNameEntered`, the same rule the domain enforces), which is
// the whole of the validation the spec asks for.
//
// Fully controlled, like BodyWeightSheet: the caller owns the in-progress text and the mutation.
// JSX/rendering only — styles live in RenameMesocycleSheetStyles.ts, per the code-style skill.

import { View } from 'react-native';

import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { TextField } from '@design/components/TextField';
import { isNameEntered } from '@domain/names';

import { styles } from './RenameMesocycleSheetStyles';

export type RenameMesocycleSheetProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChangeValue: (text: string) => void;
  /** Called with the typed name — only reachable once the field holds something. */
  onSave: (name: string) => void;
  /** The rename is in flight — Save waits for it so a double tap can't repeat it. */
  isSaving: boolean;
};

export function RenameMesocycleSheet({
  visible,
  onClose,
  value,
  onChangeValue,
  onSave,
  isSaving,
}: RenameMesocycleSheetProps) {
  const entered = isNameEntered(value);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Rename mesocycle"
      footer={
        <Button
          label="Save"
          onPress={() => {
            if (entered) {
              onSave(value);
            }
          }}
          disabled={!entered || isSaving}
        />
      }
    >
      <View style={styles.content}>
        <TextField
          label="Mesocycle name"
          value={value}
          onChangeText={onChangeValue}
          placeholder="Push/Pull/Legs"
        />
      </View>
    </BottomSheet>
  );
}
