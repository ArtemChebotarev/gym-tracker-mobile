// InlineNote — see 08.0 · Design SDK, "Компоненты": one line of explanation inside a card, its
// first phrase set a step brighter so the point lands before the sentence does. One per card
// (08.7.1 uses it for the set the entered weight has taken out of the target's reach).
//
// A plate on `surface/page` inside a `surface/card`, so it reads as inset rather than stacked —
// the opposite of the card's own relationship to the screen.

import { StyleSheet, Text, View } from 'react-native';

import { InfoIcon } from '../icons/InfoIcon';
import { BORDER_WIDTHS, COLORS, ICON_SIZES, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export type InlineNoteProps = {
  /** The opening phrase, brighter than the rest. */
  lead?: string;
  text: string;
};

export function InlineNote({ lead, text }: InlineNoteProps) {
  return (
    <View testID="inline-note" style={styles.root}>
      <InfoIcon size={ICON_SIZES['icon/small']} color={COLORS['text/secondary']} />
      <Text style={styles.text}>
        {lead !== undefined && <Text style={styles.lead}>{lead} </Text>}
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING['space/dots'],
    marginTop: SPACING['space/set-row-y'],
    paddingVertical: SPACING['space/gap-tight'],
    paddingHorizontal: SPACING['space/gap'],
    backgroundColor: COLORS['surface/page'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
  },
  text: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  lead: {
    color: COLORS['text/primary'],
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
  },
});
