// StepperRow — one numeric setting as a list row: its name (and a line under it) on the left, a
// `−  value  +` stepper on the right, a divider under it (canvas 4.2 / 4.3, "Default plan"; the
// same row is the cycle editor's plan sheet, 7.3). Where `Stepper variant="field"` is a bordered
// card with a caption label — the form field of a mesocycle's length or days — this is a quiet row
// among others and costs a third of the height.
//
// One line, always: what a setting adds to its name goes after it, in grey (`Rest · between sets`),
// not on a second line, so rows with and without a qualifier are the same row.
//
// The control is `Stepper variant="inline"`, not a second implementation; this only lays it out
// next to its label. The value is formatted by the caller, like Stepper's.

import { StyleSheet, Text, View } from 'react-native';

import { BORDER_WIDTHS, COLORS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { Stepper, type StepperProps } from './Stepper';

export type StepperRowProps = Pick<
  StepperProps,
  'label' | 'value' | 'onChange' | 'min' | 'max' | 'step' | 'formatValue'
> & {
  /** What qualifies the label, in grey after it on the same line: `Rest` + `between sets`. */
  labelSuffix?: string;
};

export function StepperRow({ label, labelSuffix, ...stepper }: StepperRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
          {labelSuffix !== undefined && <Text style={styles.suffix}>{` · ${labelSuffix}`}</Text>}
        </Text>
      </View>
      <Stepper
        variant="inline"
        label={label}
        valueWidth={SIZES['size/stepper-value']}
        {...stepper}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING['space/row'],
    // A fixed height, content centred in it.
    height: SIZES['size/stepper-row'],
    borderBottomWidth: BORDER_WIDTHS['border/default'],
    borderBottomColor: COLORS['border/divider'],
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/primary'],
  },
  suffix: {
    color: COLORS['text/muted'],
  },
});
