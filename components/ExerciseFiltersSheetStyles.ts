// Styles for ExerciseFiltersSheet.tsx — see the code-style skill, "Screens keep the same split,
// one level up".

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

// No token exists yet for a chip/option border width or the muscle-group dot's own size — same
// exception design/components/IconButton.tsx takes for its DIAMETER. Matches the dot size Chip's
// own static variant and SectionHeader already use, for visual consistency.
const BORDER_WIDTH = 1;
const DOT_SIZE = 6;
const DOT_RADIUS = DOT_SIZE / 2;

export const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING['space/section'],
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING['space/gap-tight'],
  },
  reset: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS.accent,
  },
  // A muscle-group chip's selected colors are family-tinted (see muscleGroupChipColors in
  // ExerciseFiltersSheetLogic.ts) and applied as an inline style override, the same pattern
  // Chip's own static-variant dot already uses for a caller-supplied color.
  muscleGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    borderWidth: BORDER_WIDTH,
    borderRadius: RADII['radius/pill'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
  },
  muscleGroupChipUnselected: {
    backgroundColor: COLORS['surface/card'],
    borderColor: COLORS['border/default'],
  },
  muscleGroupChipLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
  },
  muscleGroupChipLabelUnselected: {
    color: COLORS['text/secondary'],
  },
  muscleGroupDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_RADIUS,
  },
  // Source is two equal-width options, not a wrapping row of pills — a different shape (and
  // larger tap target) from Chip's, borrowed from the field chrome radius rather than the pill
  // radius chips use.
  sourceRow: {
    flexDirection: 'row',
    gap: SPACING['space/gap'],
  },
  sourceOption: {
    flex: 1,
    alignItems: 'center',
    borderWidth: BORDER_WIDTH,
    borderRadius: RADII['radius/field'],
    paddingVertical: SPACING['space/row'],
  },
  sourceOptionUnselected: {
    backgroundColor: COLORS['surface/card'],
    borderColor: COLORS['border/default'],
  },
  sourceOptionSelected: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
  },
  sourceOptionLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
  },
  sourceOptionLabelUnselected: {
    color: COLORS['text/secondary'],
  },
  sourceOptionLabelSelected: {
    color: COLORS.accent,
  },
  pressed: {
    opacity: 0.7,
  },
  // Stretches the single confirm Button to the sheet's full width inside BottomSheet's
  // flex-row, flex-end footer.
  footerButton: {
    flex: 1,
  },
});
