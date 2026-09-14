// Stepper — see 08.0 · Design SDK, "Компоненты" (added by task 073: the mesocycle editor uses a
// stepper three times — meso length 3–8, days per week 1–7, sets per exercise — but no such
// component existed in the SDK yet). Matches 08.5's own stepper-row mockup: a bordered card row
// with the current value (formatted by the caller, e.g. "6 weeks") and an optional caption
// stacked on the left, and the two circular controls grouped together on the right — corrected
// in task 075 after the mesocycle editor (08.5's own target screen for this component) revealed
// the original centered button/value/button guess didn't match the mockup's actual layout.
// Each button disables itself at its own end of the [min, max] range rather than relying on a
// single `disabled` prop, since that boundary behavior is the point of the component.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';
import { fieldStyles } from './fieldStyles';

export type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Formats the displayed value, e.g. `(v) => \`${v} weeks\``. Defaults to the bare number. */
  formatValue?: (value: number) => string;
  /** Optional second line under the value, e.g. "Includes a deload week". */
  caption?: string;
};

// No dedicated size token exists yet — same exception as IconButton's DIAMETER.
const BUTTON_DIAMETER = 30;
// Mockup (08.5's stepper-row): asymmetric row padding (10px top/bottom/right, 14px left — the
// left edge lines up with the field/label above it) and a 2px gap between the value and its
// caption. No token exists for either.
const ROW_PADDING_RIGHT = 10;
const CAPTION_MARGIN_TOP = 2;

export function Stepper({ label, value, onChange, min, max, step = 1, formatValue, caption }: StepperProps) {
  const decrementDisabled = value <= min;
  const incrementDisabled = value >= max;
  const displayValue = formatValue ? formatValue(value) : String(value);

  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={styles.row}>
        <View>
          <Text style={styles.value}>{displayValue}</Text>
          {caption !== undefined && <Text style={styles.caption}>{caption}</Text>}
        </View>
        <View style={styles.controls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decrease ${label}`}
            accessibilityState={{ disabled: decrementDisabled }}
            disabled={decrementDisabled}
            onPress={() => onChange(Math.max(min, value - step))}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              decrementDisabled && styles.buttonDisabled,
            ]}
          >
            <Text style={[styles.glyph, decrementDisabled && styles.glyphDisabled]}>−</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Increase ${label}`}
            accessibilityState={{ disabled: incrementDisabled }}
            disabled={incrementDisabled}
            onPress={() => onChange(Math.min(max, value + step))}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.pressed,
              incrementDisabled && styles.buttonDisabled,
            ]}
          >
            <Text style={[styles.glyph, incrementDisabled && styles.glyphDisabled]}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS['surface/card'],
    borderWidth: 1,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    paddingLeft: SPACING['space/screen'],
    paddingRight: ROW_PADDING_RIGHT,
    paddingVertical: SPACING['space/row'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    fontWeight: TYPOGRAPHY['type/value'].fontWeight,
    color: COLORS['text/primary'],
  },
  caption: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/faint'],
    marginTop: CAPTION_MARGIN_TOP,
  },
  controls: {
    flexDirection: 'row',
    gap: SPACING['space/gap-tight'],
  },
  button: {
    width: BUTTON_DIAMETER,
    height: BUTTON_DIAMETER,
    borderRadius: BUTTON_DIAMETER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['surface/control-active'],
  },
  pressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  glyph: {
    fontSize: TYPOGRAPHY['type/row-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/row-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  glyphDisabled: {
    color: COLORS['text/disabled'],
  },
});
