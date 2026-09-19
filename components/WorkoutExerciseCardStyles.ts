// Styles behind components/WorkoutExerciseCard.tsx — see the code-style skill.
//
// An exercise is an outlined, rounded `surface/card` card inside the screen padding, with the group
// chip above it. The 08.7 mockup (08.7-workout-session.html) draws full-width bands instead;
// Artem's review kept the cards and took only the mockup's centered set table.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

import { INDICATOR_WIDTH, LOG_COLUMN_WIDTH, SMALL_FONT_SIZE } from './WorkoutSetRowStyles';

// No tokens for these — 08.7 sizes them directly: the group chip's dot is 6pt, a skipped card sits
// at 50% opacity.
const GROUP_DOT_SIZE = 6;
const SKIPPED_OPACITY = 0.5;
const BORDER_WIDTH = 1;
export const INFO_ICON_SIZE = 15;
export const WEIGHT_HINT_ICON_SIZE = 15;

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
    paddingVertical: SPACING['space/gap-tight'] / 2,
  },
  groupDot: {
    width: GROUP_DOT_SIZE,
    height: GROUP_DOT_SIZE,
    borderRadius: GROUP_DOT_SIZE / 2,
  },
  groupLabel: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
  },
  card: {
    backgroundColor: COLORS['surface/card'],
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/control'],
    paddingHorizontal: SPACING['space/sheet'],
    paddingTop: SPACING['space/row'],
    paddingBottom: SPACING['space/gap-tight'],
  },
  skipped: {
    opacity: SKIPPED_OPACITY,
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
    fontSize: SMALL_FONT_SIZE,
    color: COLORS['text/faint'],
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  // The column header, on the set rows' grid (WorkoutSetRowStyles.ts): Weight · Reps · indicator ·
  // Log, centered, with Log flush right.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    marginTop: SPACING['space/row'],
    paddingBottom: SPACING['space/gap-tight'],
  },
  valueColumn: {
    flex: 1,
    textAlign: 'center',
  },
  indicatorColumn: {
    width: INDICATOR_WIDTH,
  },
  logColumn: {
    width: LOG_COLUMN_WIDTH,
    textAlign: 'right',
  },
  // `type/label` without its uppercase transform — the header stays `Weight, kg`, not `WEIGHT, KG`.
  columnLabel: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    color: COLORS['text/muted'],
  },
  skippedNote: {
    paddingTop: SPACING['space/row'],
    paddingBottom: SPACING['space/gap'],
    fontSize: SMALL_FONT_SIZE,
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
    fontSize: SMALL_FONT_SIZE,
    color: COLORS['text/secondary'],
  },
  notProgrammed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    marginTop: SPACING['space/row'],
    marginBottom: SPACING['space/gap'],
    backgroundColor: COLORS['surface/page'],
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/row'],
  },
  notProgrammedText: {
    fontSize: SMALL_FONT_SIZE,
    color: COLORS['text/muted'],
  },
});
