// Chip — see 08.0 · Design SDK, "Компоненты": three variants with different data needs
// (selectable takes `selected`/`onPress`, static takes an optional group dot, counter takes a
// count), so they're modeled as a discriminated union on `variant` rather than one component
// with a pile of optional props. Selectable is for multi-select only ("Selectable — только для
// мультивыбора"); static carries the group dot. Uses `type/caption`, the same scale as Badge,
// for the same sentence-case reason (see design/components/Badge.tsx). `dotColor` is supplied
// by the caller (e.g. a muscle-group category color) — this file has no literal color of its
// own for it.

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';

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
    borderWidth: 1,
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
    gap: SPACING['space/gap-tight'],
  },
  selected: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
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
    color: COLORS.accent,
  },
  unselectedLabel: {
    color: COLORS['text/secondary'],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pressed: {
    opacity: 0.7,
  },
});
