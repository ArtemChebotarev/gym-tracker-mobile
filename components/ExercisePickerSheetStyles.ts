// Styles for ExercisePickerSheet.tsx — see the code-style skill, "Screens keep the same split,
// one level up".

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  caption: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
    marginBottom: SPACING['space/gap'],
  },
  searchField: {
    marginBottom: SPACING['space/gap'],
  },
  filterRow: {
    marginBottom: SPACING['space/gap'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
  },
  // Stretches the single confirm Button to the sheet's full width inside BottomSheet's
  // flex-row, flex-end footer — same treatment as ExerciseFiltersSheetStyles.ts's footerButton.
  footerButton: {
    flex: 1,
  },
});
