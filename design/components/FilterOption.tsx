// FilterOption — one of a few full-width choices in a Filters sheet (08.6, "Filters — лист": the
// exercise library's Type and Source; GT-217: the template list's Days a week and Focus). Laid out
// by the caller in a row of equal-width options: a larger tap target and a different shape from
// Chip's wrapping pills, with the field chrome's radius rather than the pill one.
//
// Lifted out of components/ExerciseFiltersSheet.tsx when the template list got its own sheet, so
// both sheets draw the same option.

import { Pressable, StyleSheet, Text } from 'react-native';
import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export type FilterOptionProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function FilterOption({ label, selected, onPress }: FilterOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected ? styles.optionSelected : styles.optionUnselected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected ? styles.labelSelected : styles.labelUnselected]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flex: 1,
    alignItems: 'center',
    borderWidth: BORDER_WIDTHS['border/default'],
    borderRadius: RADII['radius/field'],
    paddingVertical: SPACING['space/row'],
  },
  optionUnselected: {
    backgroundColor: COLORS['surface/card'],
    borderColor: COLORS['border/default'],
  },
  optionSelected: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
  },
  label: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
  },
  labelUnselected: {
    color: COLORS['text/secondary'],
  },
  labelSelected: {
    color: COLORS.accent,
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
});
