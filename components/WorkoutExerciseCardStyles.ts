// Styles behind components/WorkoutExerciseCard.tsx — see the code-style skill.
//
// An exercise is an outlined, rounded `surface/card` card inside the screen padding, with the group
// chip above it. The 08.7 mockup (08.7-workout-session.html) draws full-width bands instead;
// Artem's review kept the cards and took only the mockup's centered set table.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import { circle, square } from '@design/shapes';

// The small secondary text of the workout screen — same as the set rows (WorkoutSetRowStyles.ts).
const META_FONT_SIZE = TYPOGRAPHY['type/meta'].fontSize;

export const styles = StyleSheet.create({
  root: {
    gap: SPACING['space/gap'],
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING['space/gap-tight'],
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/chip-y'],
  },
  groupDot: {
    ...circle(SIZES['size/dot']),
  },
  groupLabel: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
  },
  card: {
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/control'],
    paddingHorizontal: SPACING['space/sheet'],
    paddingTop: SPACING['space/row'],
    paddingBottom: SPACING['space/gap-tight'],
  },
  skipped: {
    opacity: OPACITY['opacity/dimmed'],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING['space/gap-tight'],
  },
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  equipment: {
    fontSize: META_FONT_SIZE,
    color: COLORS['text/faint'],
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  // The column header, on the set rows' grid (WorkoutSetRowStyles.ts): Weight · Reps · indicator ·
  // Log, centered, with Log flush right.
  // Tall enough to hold the ⓘ's full tap target: iOS delivers no touch outside a parent's own
  // frame, so a `hitSlop` on the button alone would be cut off by a row the height of its label.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    minHeight: SIZES['size/tap-target'],
    marginTop: SPACING['space/gap-tight'],
  },
  valueColumn: {
    flex: 1,
    textAlign: 'center',
  },
  // The Reps header carries the weight-swap ⓘ beside its label (08.7.1). It stretches to the
  // row's full height so the button inside it is a whole 44pt tall to the touch.
  repsHeader: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/dots'],
  },
  /** The ⓘ's touch area — the iOS minimum, around a disc a third of its size. */
  infoButton: {
    ...square(SIZES['size/tap-target']),
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDisc: {
    ...circle(SIZES['size/glyph-button']),
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** While its popover is open, the glyph sits on a lit disc — 08.7.1, "подсветка". */
  infoDiscOpen: {
    backgroundColor: COLORS['surface/control-active'],
  },
  indicatorColumn: {
    width: SIZES['size/indicator-column'],
  },
  logColumn: {
    width: SIZES['size/log-column'],
    textAlign: 'right',
  },
  // `type/label` without its uppercase transform — the header stays `Weight, kg`, not `WEIGHT, KG`.
  columnLabel: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    color: COLORS['text/muted'],
  },
  // The ⓘ popover's own content (08.7.1): the legend under the range track, and the plain
  // paragraph shown instead of it when there is no history to read a range from.
  popoverText: {
    marginTop: SPACING['space/dots'],
    fontSize: META_FONT_SIZE,
    color: COLORS['text/secondary'],
  },
  popoverFooter: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  legend: {
    marginTop: SPACING['space/row'],
    gap: SPACING['space/dots'],
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  legendLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  legendValue: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/primary'],
  },
  skippedNote: {
    paddingTop: SPACING['space/row'],
    paddingBottom: SPACING['space/gap'],
    fontSize: META_FONT_SIZE,
    color: COLORS['text/muted'],
  },
  weightHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    marginTop: SPACING['space/gap-tight'],
  },
  weightHintText: {
    flex: 1,
    fontSize: META_FONT_SIZE,
    color: COLORS['text/secondary'],
  },
  notProgrammed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    marginTop: SPACING['space/row'],
    marginBottom: SPACING['space/gap'],
    backgroundColor: COLORS['surface/page'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/row'],
  },
  notProgrammedText: {
    fontSize: META_FONT_SIZE,
    color: COLORS['text/muted'],
  },
});
