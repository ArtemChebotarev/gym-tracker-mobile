// Styles for ExerciseFilterRow.tsx — see the code-style skill, "Screens keep the same split, one
// level up".

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  // Sits inline with the filter row's chips, so it's sized like their own label (`type/caption`,
  // the same scale Chip.tsx uses) rather than the Filters sheet's larger header Reset — plain
  // accent-colored text, not a filled chip, so it still stands out against the row's muted chips
  // without reading larger than its neighbors.
  resetChip: {
    paddingHorizontal: SPACING['space/gap-tight'],
    paddingVertical: SPACING['space/gap-tight'],
  },
  resetChipLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    fontWeight: TYPOGRAPHY['type/caption'].fontWeight,
    color: COLORS.accent,
  },
});
