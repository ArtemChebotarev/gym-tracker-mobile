// PlanChip — the plan of a power, interval or mobility exercise in the mesocycle editor's step 2
// (10.1 FR-9, canvas 7.2): a two-line card in place of the strength row's sets stepper. The value
// on top (`3 sets`, `3 × 2:00`, `10:00`), what qualifies it below (`1:00 rest`, `Length`). One
// size for every type, so a day that mixes them still reads as one column.
//
// Domain-agnostic: the caller formats both lines. The `›` at its right edge says the plan opens
// (Artem, 18.10.2026, on-device review of GT-157); `onPress` makes it the button that does.

import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BORDER_WIDTHS, COLORS, ICON_SIZES, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

export type PlanChipProps = {
  value: string;
  caption: string;
  /** Read by a screen reader for the whole chip, e.g. "Heavy bag plan". */
  accessibilityLabel: string;
  onPress?: () => void;
};

export function PlanChip({ value, caption, accessibilityLabel, onPress }: PlanChipProps) {
  const content = (
    <>
      <View style={styles.lines}>
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </>
  );

  if (!onPress) {
    return (
      <View accessible accessibilityLabel={`${accessibilityLabel}: ${value}, ${caption}`} style={styles.chip}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}: ${value}, ${caption}`}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    width: SIZES['size/sets-column'],
    height: SIZES['size/plan-chip'],
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/xs'],
    paddingHorizontal: SPACING['space/gap-tight'],
    borderRadius: RADII['radius/segment-inner'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    backgroundColor: COLORS['surface/card'],
  },
  lines: {
    flex: 1,
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/primary'],
  },
  chevron: {
    fontSize: ICON_SIZES['icon/chevron'],
    color: COLORS['text/muted'],
  },
  caption: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/muted'],
  },
});
