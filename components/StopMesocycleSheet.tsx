// Stop mesocycle confirmation — task 052 (05 · Workout Execution & Logging, "Остановить
// мезоцикл"). Opened by the header menu's danger `Stop mesocycle`, which only closes the menu; the
// block is called off from here.
//
// A sheet rather than an Alert, because what it asks for is typed: `END MESO` into the field
// before the button does anything (Artem's review of 052 — a yes/no popup is too small a gate for
// ending weeks of training, and RP's own app asks for the words). The warning above the field says
// what goes and, as importantly, what stays: every logged set does.
//
// Fully controlled, like BodyWeightSheet: the caller owns the typed text and the mutation.
// JSX/rendering only — styles live in StopMesocycleSheetStyles.ts and pure helpers in
// StopMesocycleSheetLogic.ts, per the code-style skill.

import { Text, View } from 'react-native';

import { BottomSheet } from '@design/components/BottomSheet';
import { Button } from '@design/components/Button';
import { TextField } from '@design/components/TextField';

import {
  isStopMesocycleConfirmed,
  STOP_MESOCYCLE_PHRASE,
  STOP_MESOCYCLE_WARNING,
} from './StopMesocycleSheetLogic';
import { styles } from './StopMesocycleSheetStyles';

export type StopMesocycleSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The block being stopped, named in the subtitle so it's clear which one this is. */
  mesocycleName: string;
  value: string;
  onChangeValue: (text: string) => void;
  /** Called only once the phrase has been typed. */
  onConfirm: () => void;
  /** The stop is in flight — the button waits for it so a double tap can't repeat it. */
  isStopping: boolean;
};

export function StopMesocycleSheet({
  visible,
  onClose,
  mesocycleName,
  value,
  onChangeValue,
  onConfirm,
  isStopping,
}: StopMesocycleSheetProps) {
  const confirmed = isStopMesocycleConfirmed(value);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Stop mesocycle"
      subtitle={mesocycleName}
      footer={
        <Button
          label="Stop mesocycle"
          variant="danger"
          onPress={() => {
            if (confirmed) {
              onConfirm();
            }
          }}
          disabled={!confirmed || isStopping}
        />
      }
    >
      <View style={styles.content}>
        <Text style={styles.warning}>{STOP_MESOCYCLE_WARNING}</Text>
        <TextField
          label={`Type ${STOP_MESOCYCLE_PHRASE} to confirm`}
          value={value}
          onChangeText={onChangeValue}
          placeholder={STOP_MESOCYCLE_PHRASE}
        />
      </View>
    </BottomSheet>
  );
}
