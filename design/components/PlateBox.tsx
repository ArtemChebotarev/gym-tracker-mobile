// PlateBox — a labelled block set into a Popover's plate (08.11, "Правило ⓘ"): the label stands
// over the box, level with the plate's title, the box takes the plate's full width. The quiet one
// is a tone darker than the plate, the accent one marks what the plate's meaning rests on — the
// working set, the only thing on it that gets logged. What goes inside is the caller's.

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { BORDER_WIDTHS, COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export type PlateBoxProps = {
  label: string;
  accent?: boolean;
  children?: ReactNode;
};

export function PlateBox({ label, accent = false, children }: PlateBoxProps) {
  return (
    <>
      <Text style={[styles.label, accent && styles.labelAccent]}>{label}</Text>
      <View testID="plate-box" style={[styles.box, accent && styles.boxAccent]}>
        {children}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // `type/label` is the SDK's one capitalized section header (08.0).
  label: {
    marginTop: SPACING['space/md'],
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
  },
  labelAccent: {
    color: COLORS.accent,
  },
  box: {
    marginTop: SPACING['space/gap-tight'],
    padding: SPACING['space/md'],
    borderRadius: RADII['radius/field'],
    borderWidth: BORDER_WIDTHS['border/default'],
    backgroundColor: COLORS['surface/plate-box'],
    borderColor: COLORS['border/plate-box'],
  },
  boxAccent: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
  },
});
