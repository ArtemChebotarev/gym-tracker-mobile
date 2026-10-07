// PlateText — a line of text with a few strong words in it (08.11): the body of a PlateRow and of a
// Coachmark's paragraphs, so a thesis reads the same wherever it stands. The text comes in as parts
// — plain strings, `{ strong }` ones and `{ icon }` ones — so a screen can mark the words that
// matter, or point at a button by its own picture, without this component knowing what they are.
//
// An icon stands in the line where a symbol would not do: the "ⓘ" character is a thin outline that
// cannot be made heavier and is hard to find in a line (Artem, 06.10.2026), so the line carries the
// real icon, in the strong colour, sitting on the text's baseline.

import { StyleSheet, Text, View, type StyleProp, type TextStyle } from 'react-native';

import type { IconComponent } from '../icons/IconFrame';
import { COLORS, ICON_SIZES, LINE_HEIGHTS, SPACING, TYPOGRAPHY } from '../tokens';

/** A piece of a line of text: plain, one of its few strong words, or an icon. */
export type PlateTextPart = string | { strong: string } | { icon: IconComponent };

export type PlateTextProps = {
  parts: readonly PlateTextPart[];
  style?: StyleProp<TextStyle>;
};

export function PlateText({ parts, style }: PlateTextProps) {
  return (
    <Text style={[styles.text, style]}>
      {parts.map((part, index) =>
        typeof part === 'string' ? (
          part
        ) : 'icon' in part ? (
          <View key={index} testID="plate-text-icon" style={styles.icon}>
            <part.icon size={ICON_SIZES['icon/inline']} color={COLORS['text/primary']} />
          </View>
        ) : (
          <Text key={index} style={styles.strong}>
            {part.strong}
          </Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    lineHeight: LINE_HEIGHTS['line-height/text'],
    color: COLORS['text/secondary'],
  },
  // A view inside a line sits on its baseline, which leaves a round icon looking low; a little
  // lift sets it back on the text's centre.
  icon: {
    marginBottom: -SPACING['space/xxs'],
  },
  strong: {
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
});
