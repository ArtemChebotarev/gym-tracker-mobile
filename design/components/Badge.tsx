// Badge — see 08.0 · Design SDK, "Компоненты": accent/neutral, text-only label with no icon
// (e.g. `Custom`, `Catalog`). Uses `type/caption` rather than `type/label` — `type/label` forces
// an uppercase transform meant for section headers, and badge text stays sentence case.

import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export type BadgeVariant = 'accent' | 'neutral';

export type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const variantStyle = VARIANT_STYLE[variant];

  return (
    <View style={[styles.container, variantStyle.container]}>
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
  label: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
  },
});
