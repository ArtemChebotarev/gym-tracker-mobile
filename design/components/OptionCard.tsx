// OptionCard — one choice of a short single-select list, drawn as a card: an icon well, a title
// with a line under it, and a radio on the right (canvas 4.1, "New exercise · pick type"). The
// selected card takes the accent border and fill, the same pair a selected Chip uses. Domain-
// agnostic: the icon arrives as a node, like IconButton's.
//
// Every card is the same height (`size/option-card`) whatever it says, and its explanation holds
// to two lines, so a group of them — the type, the progression — keeps its shape from one choice
// to the next and from one screen to the next.
//
// Where a ListRow navigates or toggles a fact, this one *chooses*: tapping selects, and moving on
// is a separate action in the sheet's footer.
//
// A disabled card dims its well, title and radio, and leaves the description at full strength: it
// is what says why the card is off (08.8, `Copy a cycle` with nothing to copy), and a dimmed reason
// can't be read on a phone.

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { circle } from '../shapes';
import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

export type OptionCardProps = {
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  /** Rendered inside the round well; the caller colors it for the selected state. Without one, no well. */
  icon?: ReactNode;
  /** The option exists but can't be chosen now; the description should say why. */
  disabled?: boolean;
};

export function OptionCard({
  title,
  description,
  selected,
  onPress,
  icon,
  disabled = false,
}: OptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ selected, checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selectedCard,
        pressed && styles.pressed,
      ]}
    >
      {icon !== undefined && (
        <View style={[styles.iconWell, disabled && styles.dimmed]}>{icon}</View>
      )}
      <View style={styles.text}>
        <Text style={[styles.title, disabled && styles.dimmed]}>{title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>
      <View style={[styles.radio, selected && styles.selectedRadio, disabled && styles.dimmed]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </Pressable>
  );
}

export type OptionCardGroupProps = {
  children: ReactNode;
};

/** A single-select list of OptionCards: the gap between them and the radiogroup role. */
export function OptionCardGroup({ children }: OptionCardGroupProps) {
  return (
    <View style={styles.group} accessibilityRole="radiogroup">
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: SPACING['space/gap-tight'],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/row'],
    height: SIZES['size/option-card'],
    paddingHorizontal: SPACING['space/md'],
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
  dimmed: {
    opacity: OPACITY['opacity/dimmed'],
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
  },
  selectedRadio: {
    borderColor: COLORS.accent,
  },
  radioDot: {
    ...circle(SIZES['size/radio-dot']),
    backgroundColor: COLORS.accent,
  },
});
