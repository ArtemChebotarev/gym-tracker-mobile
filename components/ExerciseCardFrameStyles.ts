// Styles behind components/ExerciseCardFrame.tsx — see the code-style skill.
//
// An exercise is an outlined, rounded `surface/card` card inside the screen padding, with the group
// chip above it. The 08.7 mockup (08.7-workout-session.html) draws full-width bands instead;
// Artem's review kept the cards and took only the mockup's centered set table.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import { circle } from '@design/shapes';

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
  typeChip: {
    backgroundColor: COLORS['surface/card'],
  },
  typeLabel: {
    color: COLORS['text/secondary'],
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
  // Centered: a card with no equipment line has a one-line title, which sits level with its badge
  // and buttons instead of at the top of them.
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  titleBlock: {
    flex: 1,
  },
  // The name is the link to Overview (GT-178): pressable only as wide as its text, so a tap on the
  // empty part of the row or on the equipment line below does nothing.
  nameLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  name: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  // A thin grey line, drawn rather than the text's own underline: that one, as thick as the font and
  // in the name's white, drew the eye before the name did (Artem, GT-178).
  nameText: {
    flexShrink: 1,
    borderBottomWidth: BORDER_WIDTHS['border/hairline'],
    borderBottomColor: COLORS['text/faint'],
  },
  nameChevron: {
    color: COLORS.accent,
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
  skippedNote: {
    paddingTop: SPACING['space/row'],
    paddingBottom: SPACING['space/gap'],
    fontSize: META_FONT_SIZE,
    color: COLORS['text/muted'],
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
