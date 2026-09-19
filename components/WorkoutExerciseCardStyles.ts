// Styles behind components/WorkoutExerciseCard.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

import { LOG_BOX_SIZE, SET_NUMBER_WIDTH } from './WorkoutSetRowStyles';

// No tokens for these — 08.7 sizes them directly: the equipment line is `text/faint 12`, the group
// chip's dot is 6pt, and a skipped card sits at 50% opacity.
const EQUIPMENT_FONT_SIZE = 12;
const GROUP_DOT_SIZE = 6;
const SKIPPED_OPACITY = 0.5;
const CARD_BORDER_WIDTH = 1;
export const INFO_ICON_SIZE = 16;

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
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
  },
  groupDot: {
    width: GROUP_DOT_SIZE,
    height: GROUP_DOT_SIZE,
    borderRadius: GROUP_DOT_SIZE / 2,
  },
  groupLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
  },
  card: {
    gap: SPACING['space/row'],
    backgroundColor: COLORS['surface/card'],
    borderWidth: CARD_BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/control'],
    paddingHorizontal: SPACING['space/sheet'],
    paddingVertical: SPACING['space/row'],
  },
  skipped: {
    opacity: SKIPPED_OPACITY,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING['space/gap'],
  },
  titleBlock: {
    flex: 1,
    gap: SPACING['space/gap-tight'] / 2,
  },
  name: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  equipment: {
    fontSize: EQUIPMENT_FONT_SIZE,
    color: COLORS['text/faint'],
  },
  titleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  // The column header lines up with the set rows' grid (WorkoutSetRowStyles.ts): number · Weight ·
  // Reps · Log.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  setNumberColumn: {
    width: SET_NUMBER_WIDTH,
  },
  valueColumn: {
    flex: 1,
  },
  logColumn: {
    width: LOG_BOX_SIZE,
    alignItems: 'center',
  },
  // `type/label` without its uppercase transform — the header stays `Weight, kg`, not `WEIGHT, KG`.
  columnLabel: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    color: COLORS['text/muted'],
  },
  skippedRow: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/muted'],
  },
  notProgrammed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    backgroundColor: COLORS['surface/page'],
    borderWidth: CARD_BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/gap'],
  },
  notProgrammedText: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/muted'],
  },
});
