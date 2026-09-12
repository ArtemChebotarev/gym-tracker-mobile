// IconButton — see 08.0 · Design SDK, "Компоненты": circular accent/neutral button, always
// labeled for accessibility, 28–30pt (no dedicated size token exists for this yet, so the
// diameter below is a plain number rather than a design/tokens.ts value). The icon glyph is
// passed in as `children` rather than owned by this component — the project has not adopted an
// icon library yet, so IconButton only owns the circular frame and background; the caller is
// responsible for rendering an icon that already matches the chosen variant.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../tokens';

export type IconButtonVariant = 'accent' | 'neutral';

export type IconButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
  variant?: IconButtonVariant;
  disabled?: boolean;
};

const DIAMETER = 30;

export function IconButton({
  accessibilityLabel,
  onPress,
  children,
  variant = 'neutral',
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        VARIANT_STYLE[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

const VARIANT_STYLE = {
  accent: { backgroundColor: COLORS.accent },
  neutral: { backgroundColor: COLORS['surface/card'] },
} as const;

const styles = StyleSheet.create({
  base: {
    width: DIAMETER,
    height: DIAMETER,
    borderRadius: DIAMETER / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
});
