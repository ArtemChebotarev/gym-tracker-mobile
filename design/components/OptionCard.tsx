// OptionCard — one choice of a short single-select list, drawn as a card: an icon well, a title
// with a line under it, and a radio on the right (canvas 4.1, "New exercise · pick type"). The
// selected card takes the accent border and fill, the same pair a selected Chip uses. Domain-
// agnostic: the icon arrives as a node, like IconButton's.
//
// Where a ListRow navigates or toggles a fact, this one *chooses*: tapping selects, and moving on
// is a separate action in the sheet's footer.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { circle } from '../shapes';
import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

export type OptionCardProps = {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  /** Rendered inside the round well; the caller colors it for the selected state. */
  icon: ReactNode;
};

export function OptionCard({ title, description, selected, onPress, icon }: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selectedCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconWell}>{icon}</View>
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <View style={[styles.radio, selected && styles.selectedRadio]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING['space/row'],
    padding: SPACING['space/md'],
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
  },
  selectedCard: {
    backgroundColor: COLORS['surface/control-active'],
    borderColor: COLORS['accent/border'],
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  iconWell: {
    ...circle(SIZES['size/option-icon']),
    backgroundColor: COLORS['surface/page'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY['type/body'],
    color: COLORS['text/primary'],
  },
  description: {
    ...TYPOGRAPHY['type/meta'],
    color: COLORS['text/secondary'],
  },
  radio: {
    ...circle(SIZES['size/radio']),
    borderWidth: BORDER_WIDTHS['border/emphasis'],
    borderColor: COLORS['border/cell-quiet'],
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING['space/xs'],
  },
  selectedRadio: {
    borderColor: COLORS.accent,
  },
  radioDot: {
    ...circle(SIZES['size/radio-dot']),
    backgroundColor: COLORS.accent,
  },
});
