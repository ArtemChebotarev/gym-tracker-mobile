// Chip — see 08.0 · Design SDK, "Компоненты": three variants with different data needs
// (selectable takes `selected`/`onPress`, static takes an optional group dot, counter takes a
// count), so they're modeled as a discriminated union on `variant` rather than one component
// with a pile of optional props. Selectable is for multi-select only ("Selectable — только для
// мультивыбора"); static carries the group dot. Uses `type/caption`, the same scale as Badge,
// for the same sentence-case reason (see design/components/Badge.tsx). `dotColor` is supplied
// by the caller (e.g. a muscle-group category color) — this file has no literal color of its
// own for it. Selected is a solid accent fill (same weight as the accent IconButton) — its only
// current caller is the list's "Filters" chip, which is exactly that: a single filled indicator,
// not one of several equally-weighted options. A muscle-group filter's own selected chip needs a
// per-family tint instead (a different treatment for a different meaning — "this option is
// picked" vs. "this is the one thing to press"), so it's composed locally in
// ExerciseFiltersSheet.tsx rather than folded into this component as another prop.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { circle, tapTargetSlop } from '../shapes';

type SelectableChipProps = {
  variant: 'selectable';
  label: string;
  selected: boolean;
  onPress: () => void;
};

type StaticChipProps = {
  variant: 'static';
  label: string;
  dotColor?: string;
};

type CounterChipProps = {
  variant: 'counter';
  label: string;
  count: number;
};

export type ChipProps = SelectableChipProps | StaticChipProps | CounterChipProps;

export function Chip(props: ChipProps) {
  if (props.variant === 'selectable') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: props.selected }}
        onPress={props.onPress}
        hitSlop={tapTargetSlop(SIZES['size/chip'])}
        style={({ pressed }) => [
          styles.container,
          props.selected ? styles.selected : styles.unselected,
          pressed && styles.pressed,
        ]}
      >
        <Text style={[styles.label, props.selected ? styles.selectedLabel : styles.unselectedLabel]}>
          {props.label}
        </Text>
      </Pressable>
    );
  }

  if (props.variant === 'static') {
    return (
      <View style={[styles.container, styles.unselected]}>
        {props.dotColor !== undefined && (
          <View style={[styles.dot, { backgroundColor: props.dotColor }]} />
        )}
        <Text style={[styles.label, styles.unselectedLabel]}>{props.label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.unselected]}>
      <Text style={[styles.label, styles.unselectedLabel]}>
        {props.label} {props.count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    // Every variant is `size/chip` tall, so a static chip lines up with a selectable one — and a
    // selectable one reaches the 44pt tap target through `tapTargetSlop`.
    minHeight: SIZES['size/chip'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
    gap: SPACING['space/gap-tight'],
  },
  // Solid accent fill — the same treatment as the accent IconButton (e.g. the list's "+" and
  // "Filters" chip), not the muted accent/bg + accent/border pair used for a muscle-group tint.
  selected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  unselected: {
    backgroundColor: COLORS['surface/card'],
    borderColor: COLORS['border/default'],
  },
  label: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
  },
  selectedLabel: {
    color: COLORS['accent/on'],
  },
  unselectedLabel: {
    color: COLORS['text/secondary'],
  },
  dot: {
    ...circle(SIZES['size/dot']),
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
});
