// PlateRow — one thesis on a Popover or Coachmark: a small round mark on the left (an icon, or a
// step number) and one or two lines of text beside it, a keyword or two in the stronger weight.
// The explanations of 08.11 are a few of these under a picture, not a paragraph — a wall of text
// carries the information and gets skipped (Artem, 06.10.2026).
//
// The text is parts, not a string, so a screen can mark the words that matter without this
// component knowing what they are: `['Stop a set when ', { strong: 'about 3 reps are left' }]`.

import { StyleSheet, Text, View } from 'react-native';

import type { IconComponent } from '../icons/IconFrame';
import { circle } from '../shapes';
import { BORDER_WIDTHS, COLORS, ICON_SIZES, LINE_HEIGHTS, SIZES, SPACING, TYPOGRAPHY } from '../tokens';

/** A piece of a row's text: plain, or one of its few strong words. */
export type PlateTextPart = string | { strong: string };

export type PlateRowLeading = { icon: IconComponent } | { number: number };

export type PlateRowProps = {
  leading: PlateRowLeading;
  text: readonly PlateTextPart[];
};

export function PlateRow({ leading, text }: PlateRowProps) {
  return (
    <View style={styles.row}>
      <View testID="plate-row-mark" style={styles.mark}>
        {'icon' in leading ? (
          <leading.icon size={ICON_SIZES['icon/small']} color={COLORS['text/secondary']} />
        ) : (
          <Text style={styles.number}>{leading.number}</Text>
        )}
      </View>
      <Text style={styles.text}>
        {text.map((part, index) =>
          typeof part === 'string' ? (
            part
          ) : (
            <Text key={index} style={styles.strong}>
              {part.strong}
            </Text>
          ),
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  mark: {
    ...circle(SIZES['size/badge']),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
  },
  number: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/secondary'],
  },
  text: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    lineHeight: LINE_HEIGHTS['line-height/text'],
    color: COLORS['text/secondary'],
  },
  strong: {
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
});
