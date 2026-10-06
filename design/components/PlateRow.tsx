// PlateRow — one thesis on a Popover or Coachmark: a small round mark on the left (an icon, or a
// step number) and one or two lines of text beside it, a keyword or two in the stronger weight.
// The explanations of 08.11 are a few of these under a picture, not a paragraph — a wall of text
// carries the information and gets skipped (Artem, 06.10.2026).
//
// The text is parts, not a string (`PlateText`), so a screen can mark the words that matter without
// this component knowing what they are: `['Stop a set when ', { strong: 'about 3 reps are left' }]`.

import { StyleSheet, Text, View } from 'react-native';

import type { IconComponent } from '../icons/IconFrame';
import { circle } from '../shapes';
import { BORDER_WIDTHS, COLORS, ICON_SIZES, SIZES, SPACING, TYPOGRAPHY } from '../tokens';
import { PlateText, type PlateTextPart } from './PlateText';

export type { PlateTextPart };

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
      <PlateText parts={text} style={styles.text} />
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
  },
});
