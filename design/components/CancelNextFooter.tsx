// CancelNextFooter — the footer of a sheet that chooses and then moves on (New exercise, the
// creation-method sheet; 08.0, "Формы и шаги визарда"): Cancel and Next at the same width, the
// exception to "primary справа" being the width only — Next is still the primary, still on the right.
//
// The `flex: 1` on the row is what stretches it: BottomSheet's footer is a row with
// `justifyContent: 'flex-end'`, so a child with no flex of its own shrinks to its content.

import { StyleSheet, View } from 'react-native';

import { SPACING } from '../tokens';
import { Button } from './Button';

export type CancelNextFooterProps = {
  onCancel: () => void;
  onNext: () => void;
};

export function CancelNextFooter({ onCancel, onNext }: CancelNextFooterProps) {
  return (
    <View style={styles.row}>
      <View style={styles.button}>
        <Button label="Cancel" variant="secondary" onPress={onCancel} />
      </View>
      <View style={styles.button}>
        <Button label="Next" onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: SPACING['space/gap'],
  },
  button: {
    flex: 1,
  },
});
