// Styles for ExerciseFiltersSheet.tsx — see the code-style skill, "Screens keep the same split,
// one level up".

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

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
});
