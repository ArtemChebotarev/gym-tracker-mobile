// IconButton — see 08.0 · Design SDK, "Компоненты": circular accent/neutral button, always
// labeled for accessibility, 36pt (`size/icon-button`) drawn, 44pt to the touch (`tapTargetSlop`).
// The icon glyph is passed in as `children` rather than owned by this component — IconButton only
// owns the circular frame and background; the caller renders one of the design/icons/ components at
// `ICON_SIZES['icon/button']`, in a color that matches the chosen variant.
//
// That frame is exported (`iconButtonFrame`) for ActionMenu, whose trigger is a native menu rather
// than a Pressable and so can't be an IconButton, but has to be the same circle beside one.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, OPACITY, SIZES } from '../tokens';
import { circle, tapTargetSlop } from '../shapes';

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
      hitSlop={tapTargetSlop(SIZES['size/icon-button'])}
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

/** The circle an icon button draws, in a given variant — for anything that has to match one. */
export function iconButtonFrame(variant: IconButtonVariant = 'neutral'): StyleProp<ViewStyle> {
  return [styles.base, VARIANT_STYLE[variant]];
}

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
