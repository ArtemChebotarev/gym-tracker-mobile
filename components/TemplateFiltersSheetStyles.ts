// Styles for TemplateFiltersSheet.tsx — see the code-style skill, "Screens keep the same split, one
// level up".

import { StyleSheet } from 'react-native';

import { SPACING } from '@design/tokens';

export const styles = StyleSheet.create({
  // A row of equal-width FilterOptions, as the exercise sheet lays out its Source.
  optionRows: {
    gap: SPACING['space/gap'],
  },
  optionRow: {
    flexDirection: 'row',
    gap: SPACING['space/gap'],
  },
});
