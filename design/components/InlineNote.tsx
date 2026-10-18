// InlineNote — see 08.0 · Design SDK, "Компоненты": one line of explanation inside a card, its
// first phrase set a step brighter so the point lands before the sentence does. One per card
// (08.7.1 uses it for the set the entered weight has taken out of the target's reach).
//
// A plate on `surface/page` inside a `surface/card`, so it reads as inset rather than stacked —
// the opposite of the card's own relationship to the screen.

import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { IconComponent } from '../icons/IconFrame';
import { InfoIcon } from '../icons/InfoIcon';
import { BORDER_WIDTHS, COLORS, ICON_SIZES, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export type InlineNoteProps = {
  /** The opening phrase, brighter than the rest. */
  lead?: string;
  text: string;
  /** The mark on the left; the info glyph when none is given. */
  icon?: IconComponent;
  /** Actions under the text — links the note leads to, like "No heavier available". */
  children?: ReactNode;
};

export function InlineNote({ lead, text, icon: Icon = InfoIcon, children }: InlineNoteProps) {
  const message = (
    <Text style={styles.text}>
      {lead !== undefined && <Text style={styles.lead}>{lead} </Text>}
      {text}
    </Text>
  );
  return (
    <View testID="inline-note" style={styles.root}>
      <Icon size={ICON_SIZES['icon/small']} color={COLORS['text/secondary']} />
      {children === undefined ? (
        message
      ) : (
        <View style={styles.body}>
          {message}
          {children}
        </View>
      )}
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
  body: {
    flex: 1,
    alignItems: 'flex-start',
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
