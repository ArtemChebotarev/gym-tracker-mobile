// Badge — see 08.0 · Design SDK, "Компоненты": accent/neutral, text-only label with no icon
// (e.g. `Custom`, `Catalog`). Uses `type/caption` rather than `type/label` — `type/label` forces
// an uppercase transform meant for section headers, and badge text stays sentence case.

import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

export type BadgeVariant = 'accent' | 'neutral';

/** `regular` (the default), or `compact` — a ListRow's tags, a line of small pills (GT-217). */
export type BadgeSize = 'regular' | 'compact';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
};

export function Badge({ label, variant = 'neutral', size = 'regular' }: BadgeProps) {
  const variantStyle = VARIANT_STYLE[variant];

  return (
    <View style={[styles.container, variantStyle.container, size === 'compact' && styles.compact]}>
      <Text style={[styles.label, variantStyle.label]}>{label}</Text>
    </View>
  );
}

const VARIANT_STYLE = {
  accent: {
    container: { backgroundColor: COLORS['accent/bg'] },
    label: { color: COLORS.accent },
  },
  neutral: {
    container: { backgroundColor: COLORS['surface/card'] },
    label: { color: COLORS['text/secondary'] },
  },
} as const;

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
  },
  compact: {
    height: SIZES['size/tag'],
    justifyContent: 'center',
    borderRadius: RADII['radius/capsule'],
    paddingHorizontal: SPACING['space/gap-tight'],
    paddingVertical: 0,
  },
  label: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
  },
});
