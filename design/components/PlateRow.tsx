// PlateRow — one thesis on a Popover or Coachmark: a small round mark on the left (an icon, or a
// step number) and one or two lines of text beside it, a keyword or two in the stronger weight.
// The explanations of 08.11 are a few of these under a picture, not a paragraph — a wall of text
// carries the information and gets skipped (Artem, 06.10.2026).
//
// The text is parts, not a string (`PlateText`), so a screen can mark the words that matter without
// this component knowing what they are: `['Stop a set when ', { strong: 'about 3 reps are left' }]`.
//
// The mark stands level with the text's first line, however many lines follow: a number is read
// before its sentence, so it sits where the sentence starts (Artem, 02.11.2026).

import { StyleSheet, Text, View } from 'react-native';

import type { IconComponent } from '../icons/IconFrame';
import { circle } from '../shapes';
import {
  BORDER_WIDTHS,
  COLORS,
  ICON_SIZES,
  LINE_HEIGHTS,
  SIZES,
  SPACING,
  TYPOGRAPHY,
} from '../tokens';
import { PlateText, type PlateTextPart } from './PlateText';

export type { PlateTextPart };

const LINE_HEIGHT = LINE_HEIGHTS['line-height/text'];

export type PlateRowLeading = { icon: IconComponent } | { number: number };

export type PlateRowProps = {
  leading: PlateRowLeading;
  text: readonly PlateTextPart[];
  /**
   * A smaller mark, as tall as the line beside it: rows of steps then pitch like the rows of a
   * legend. Numbers only — an icon does not fit in it.
   */
  compact?: boolean;
  /** The accent tint on the mark — the one row of a plate the rest of it leads up to (08.11). */
  accent?: boolean;
  /** Set in a `PlateBox`: `border/default` is lost on its surface, so the mark is outlined stronger. */
  boxed?: boolean;
};

export function PlateRow({
  leading,
  text,
  compact = false,
  accent = false,
  boxed = false,
}: PlateRowProps) {
  return (
    <View style={styles.row}>
      <View
        testID="plate-row-mark"
        style={[
          styles.mark,
          compact && styles.markCompact,
          boxed && styles.markBoxed,
          accent && styles.markAccent,
        ]}
      >
        {'icon' in leading ? (
          <leading.icon size={ICON_SIZES['icon/small']} color={COLORS['text/secondary']} />
        ) : (
          <Text style={[styles.number, accent && styles.numberAccent]}>{leading.number}</Text>
        )}
      </View>
      <PlateText parts={text} style={compact ? styles.textCompact : styles.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  markCompact: {
    ...circle(SIZES['size/badge-compact']),
    // A pixel shorter than the line: half of that centres it on the line.
    marginTop: (LINE_HEIGHT - SIZES['size/badge-compact']) / 2,
  },
  markBoxed: {
    backgroundColor: COLORS['surface/plate-box'],
    borderColor: COLORS['border/cell-quiet'],
  },
  markAccent: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS.accent,
  },
  numberAccent: {
    color: COLORS.accent,
  },
  number: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS['text/secondary'],
  },
  // Taller than the line, so the line comes down to the mark's centre.
  text: {
    flex: 1,
    paddingTop: (SIZES['size/badge'] - LINE_HEIGHT) / 2,
  },
  textCompact: {
    flex: 1,
  },
});
