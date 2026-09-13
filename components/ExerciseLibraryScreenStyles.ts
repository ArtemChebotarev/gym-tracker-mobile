// Styles for ExerciseLibraryScreen.tsx — see AGENTS.md, "Code organization" ("Screens keep the
// same split, one level up.").

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  addIcon: {
    fontSize: TYPOGRAPHY['type/entity-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/entity-title'].fontWeight,
    color: COLORS['accent/on'],
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
  },
  // Same treatment as the Filters sheet's own header Reset action (ExerciseFiltersSheetStyles.ts)
  // — plain accent-colored text, not a filled chip — so it reads as the same action wherever it
  // appears, and stands out against the row's muted chips rather than blending in.
  resetChip: {
    paddingHorizontal: SPACING['space/gap-tight'],
    paddingVertical: SPACING['space/gap-tight'],
  },
  resetChipLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS.accent,
  },
});
