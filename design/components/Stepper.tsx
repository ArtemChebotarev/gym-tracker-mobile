// Stepper — see 08.0 · Design SDK, "Компоненты" (added by task 073: the mesocycle editor uses a
// stepper three times — meso length 3–8, days per week 1–7, sets per exercise — but no such
// component existed in the SDK yet). Decrement/increment buttons mirror IconButton's circular
// neutral treatment; the value uses `type/value`, the same token StatTile uses for a number.
// Each button disables itself at its own end of the [min, max] range rather than relying on a
// single `disabled` prop, since that boundary behavior is the point of the component.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../tokens';
import { fieldStyles } from './fieldStyles';

export type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
};

// No dedicated size token exists yet — same exception as IconButton's DIAMETER.
const BUTTON_DIAMETER = 30;

export function Stepper({ label, value, onChange, min, max, step = 1 }: StepperProps) {
  const decrementDisabled = value <= min;
  const incrementDisabled = value >= max;

  return (
    <View>
      <Text style={fieldStyles.label}>{label}</Text>
      <View style={styles.row}>
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
        <Text style={styles.value}>{value}</Text>
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
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  button: {
    width: BUTTON_DIAMETER,
    height: BUTTON_DIAMETER,
    borderRadius: BUTTON_DIAMETER / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['surface/card'],
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
  value: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    fontWeight: TYPOGRAPHY['type/value'].fontWeight,
    color: COLORS['text/primary'],
  },
});
