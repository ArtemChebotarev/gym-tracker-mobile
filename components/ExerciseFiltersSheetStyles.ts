// Styles for ExerciseFiltersSheet.tsx — see the code-style skill, "Screens keep the same split,
// one level up".

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import { circle } from '@design/shapes';

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
  // A muscle-group chip's selected colors are family-tinted (see getMuscleGroupChipColors in
  // design/muscleGroupColor.ts) and applied as an inline style override, the same pattern
  // Chip's own static-variant dot already uses for a caller-supplied color.
  muscleGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    borderWidth: BORDER_WIDTHS['border/default'],
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
    ...circle(SIZES['size/dot']),
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
    borderWidth: BORDER_WIDTHS['border/default'],
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
    opacity: OPACITY['opacity/pressed'],
  },
  // Stretches the single confirm Button to the sheet's full width inside BottomSheet's
  // flex-row, flex-end footer.
  footerButton: {
    flex: 1,
  },
});
