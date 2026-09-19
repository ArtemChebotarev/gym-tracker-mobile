// IconButton — see 08.0 · Design SDK, "Компоненты": circular accent/neutral button, always
// labeled for accessibility, 28–30pt (`size/icon-button`). The icon glyph is
// passed in as `children` rather than owned by this component — IconButton only owns the circular
// frame and background; the caller renders one of the design/icons/ components at
// `ICON_SIZES['icon/button']`, in a color that matches the chosen variant.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { COLORS, OPACITY, SIZES } from '../tokens';
import { circle } from '../shapes';

export type IconButtonVariant = 'accent' | 'neutral';

export type IconButtonProps = {
  accessibilityLabel: string;
  onPress: () => void;
  children: ReactNode;
  variant?: IconButtonVariant;
  disabled?: boolean;
};

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
    ...circle(SIZES['size/icon-button']),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  disabled: {
    opacity: OPACITY['opacity/dimmed'],
  },
});
