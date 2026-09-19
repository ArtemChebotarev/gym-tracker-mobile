// Styles behind components/WorkoutExerciseCard.tsx — see the code-style skill.
//
// Laid out after the 08.7 mockup (08.7-workout-session.html): an exercise is a full-width
// `surface/card` band — no outline, no rounded corners — and the bands are split by a hairline of
// the page showing through. The group chip sits on the page above its band.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

import {
  INDICATOR_WIDTH,
  LOG_COLUMN_WIDTH,
  SET_NUMBER_WIDTH,
  SMALL_FONT_SIZE,
} from './WorkoutSetRowStyles';

// No tokens for these — 08.7 sizes them directly: the group chip's dot is 6pt, a skipped card sits
// at 50% opacity.
const GROUP_DOT_SIZE = 6;
const SKIPPED_OPACITY = 0.5;
const PLATE_BORDER_WIDTH = 1;
export const INFO_ICON_SIZE = 15;

export const styles = StyleSheet.create({
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: SPACING['space/gap-tight'],
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/gap-tight'] / 2,
    marginTop: SPACING['space/sheet'],
    marginBottom: SPACING['space/gap-tight'],
    marginHorizontal: SPACING['space/screen'],
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
    marginBottom: StyleSheet.hairlineWidth,
    paddingHorizontal: SPACING['space/screen'],
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
  // The column header, on the set rows' grid (WorkoutSetRowStyles.ts): number · Weight · Reps ·
  // indicator · Log, centered, with Log flush right.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    marginTop: SPACING['space/row'],
    paddingBottom: SPACING['space/gap-tight'],
  },
  setNumberColumn: {
    width: SET_NUMBER_WIDTH,
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
  notProgrammed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    marginTop: SPACING['space/row'],
    marginBottom: SPACING['space/gap'],
    backgroundColor: COLORS['surface/page'],
    borderWidth: PLATE_BORDER_WIDTH,
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
