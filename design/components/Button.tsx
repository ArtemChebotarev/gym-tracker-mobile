// Button — see 08.0 · Design SDK, "Компоненты": primary/secondary/danger variants, each with
// enabled/disabled/pressed states. Danger is outline-and-text only ("Danger никогда не
// заливается") — a filled destructive color would read louder than the accent and break the
// one-accent-per-screen hierarchy.

import { Pressable, StyleSheet, Text } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: ButtonProps) {
  const variantStyle = VARIANT_STYLE[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle.container,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.label, variantStyle.label]}>{label}</Text>
    </Pressable>
  );
}

const VARIANT_STYLE = {
  primary: {
    container: { backgroundColor: COLORS.accent },
    label: { color: COLORS['accent/on'] },
  },
  secondary: {
    container: { backgroundColor: COLORS['surface/card'] },
    label: { color: COLORS['text/secondary'] },
  },
  danger: {
    container: { borderWidth: 1, borderColor: COLORS['danger/border'] },
    label: { color: COLORS.danger },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    borderRadius: RADII['radius/control'],
    paddingVertical: SPACING['space/gap'],
    paddingHorizontal: SPACING['space/section'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
