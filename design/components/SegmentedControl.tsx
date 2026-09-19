// SegmentedControl — see 08.0 · Design SDK, "Компоненты": 2–3 segments for switching the view
// of one entity, not for navigation (08.0: "не для навигации"). The active segment's background
// reuses `surface/control-active`, the same token used for a selected list row (08.0:
// "Активный сегмент, выбранная строка списка"). Modeled after Chip's selectable variant
// (accessibilityRole="button" + accessibilityState.selected) for consistency across the SDK.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, OPACITY, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export type SegmentedControlOption = {
  value: string;
  label: string;
};

export type SegmentedControlProps = {
  options: readonly SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              active && styles.activeSegment,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS['surface/card'],
    borderRadius: RADII['radius/field'],
    padding: SPACING['space/xxs'],
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING['space/row'],
    borderRadius: RADII['radius/segment-inner'],
  },
  activeSegment: {
    backgroundColor: COLORS['surface/control-active'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  label: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/muted'],
  },
  activeLabel: {
    color: COLORS['text/primary'],
  },
});
