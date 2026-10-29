// Chip — see 08.0 · Design SDK, "Компоненты": two variants with different data needs (action
// takes `active`/`onPress` and an icon, static takes an optional group dot), so they're modeled as a discriminated union on `variant` rather than one component
// with a pile of optional props. Uses `type/caption`, the same scale as Badge, for the same
// sentence-case reason (see design/components/Badge.tsx). `dotColor` is supplied by the caller
// (e.g. a muscle-group category color) — this file has no literal color of its own for it.
//
// Action is a chip that opens something — the exercise list's `Filters` (GT-150). It must not
// read as one more tag in the row, so it is tonal (a step lighter than the chips beside it, text
// at full strength, an icon in front) rather than outlined; `active` turns it into the accent wash,
// for "something is applied behind this". Never the solid accent fill: that is the screen's main
// action (`Log`, `Start`). A muscle-group filter's own selected chip needs a per-family tint
// instead, so it's composed locally in ExerciseFiltersSheet.tsx rather than folded in here.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IconComponent } from '../icons/IconFrame';
import {
  BORDER_WIDTHS,
  COLORS,
  ICON_SIZES,
  OPACITY,
  RADII,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '../tokens';
import { circle, tapTargetSlop } from '../shapes';

type ActionChipProps = {
  variant: 'action';
  label: string;
  /** Drawn before the label, in the label's color. */
  icon: IconComponent;
  /** Something is applied behind the chip — it takes the accent wash. */
  active: boolean;
  onPress: () => void;
};

type StaticChipProps = {
  variant: 'static';
  label: string;
  dotColor?: string;
  /** A glyph before the label (the type chip in a page's header). Rendered as given. */
  icon?: ReactNode;
  /**
   * Drops the `size/chip` height for the tighter padding of the workout's group chip. A static chip
   * is never tapped, so it needs no tap target — for a lone mark like the workout card's RIR, not
   * for a chip sitting in a row next to a selectable one.
   */
  compact?: boolean;
  /**
   * A fixed width, label centered — so a column of chips with different labels reads as a column
   * (the first-weight ladder's `12 reps` / `8 reps` / `4 reps`, 08.11). A `SIZES` token.
   */
  width?: number;
  /**
   * The accent tint — dark green fill, green outline and text — for a chip that carries the point of
   * the plate it sits on, like the first-weight ladder's rep counts (08.11). The same pair the
   * accent has everywhere it is a wash rather than a fill.
   */
  accent?: boolean;
};

export type ChipProps = ActionChipProps | StaticChipProps;

export function Chip(props: ChipProps) {
  if (props.variant === 'action') {
    const Icon = props.icon;
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: props.active }}
        onPress={props.onPress}
        hitSlop={tapTargetSlop(SIZES['size/chip'])}
        style={({ pressed }) => [
          styles.container,
          styles.action,
          props.active ? styles.accentTint : styles.tonal,
          pressed && styles.pressed,
        ]}
      >
        <Icon
          size={ICON_SIZES['icon/chip']}
          color={props.active ? COLORS.accent : COLORS['text/primary']}
        />
        <Text style={[styles.label, props.active ? styles.accentLabel : styles.tonalLabel]}>
          {props.label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        props.compact && styles.compact,
        props.accent ? styles.accentTint : styles.unselected,
        props.width !== undefined && { width: props.width, justifyContent: 'center' },
      ]}
    >
      {props.icon}
      {props.dotColor !== undefined && (
        <View style={[styles.dot, { backgroundColor: props.dotColor }]} />
      )}
      <Text style={[styles.label, props.accent ? styles.accentLabel : styles.unselectedLabel]}>
        {props.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    // Every variant is `size/chip` tall, so a static chip lines up with an action one — and an
    // action one reaches the 44pt tap target through `tapTargetSlop`.
    minHeight: SIZES['size/chip'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
    gap: SPACING['space/gap-tight'],
  },
  compact: {
    minHeight: 0,
    paddingVertical: SPACING['space/chip-y'],
  },
  // Wider than the tags beside it: a button you press, with an icon to fit, not one more label.
  action: {
    paddingHorizontal: SPACING['space/md'],
  },
  // A step lighter than `surface/card`, like the IconButton on a card, with no outline of its own.
  tonal: {
    backgroundColor: COLORS['surface/control-active'],
    borderColor: COLORS['surface/control-active'],
  },
  tonalLabel: {
    color: COLORS['text/primary'],
  },
  unselected: {
    backgroundColor: COLORS['surface/card'],
    borderColor: COLORS['border/default'],
  },
  accentTint: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
  },
  accentLabel: {
    color: COLORS.accent,
  },
  label: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
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
