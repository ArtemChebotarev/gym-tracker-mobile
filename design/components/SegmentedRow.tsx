// SegmentedRow — a row of a card that picks one of two or three short options at its end, with a
// compact SegmentedControl (GT-269: `Weight unit  kg | lb`). As tall as a Toggle's row, so it sits
// in the same card as toggles and steppers; for a choice whose options need room to read, use a
// full-width SegmentedControl instead.

import { StyleSheet, Text, View } from 'react-native';

import { SegmentedControl, type SegmentedControlOption } from './SegmentedControl';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';

export type SegmentedRowProps = {
  label: string;
  options: readonly SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedRow({ label, options, value, onChange }: SegmentedRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <SegmentedControl compact options={options} value={value} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING['space/gap'],
    paddingVertical: SPACING['space/row'],
  },
  label: {
    flexShrink: 1,
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
});
