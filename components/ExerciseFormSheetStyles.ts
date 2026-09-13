// Styles for ExerciseFormSheet.tsx — see the code-style skill, "Screens keep the same split, one
// level up".

import { StyleSheet } from 'react-native';

import { SPACING } from '@design/tokens';

// Matches 03-new-exercise.html's .btn.p{flex:1.4} beside a flex:1 Cancel — the confirming
// button reads wider than Cancel. No token exists for a flex ratio (it isn't a size or color),
// so this stays a local constant, the same exception ExerciseFiltersSheetStyles.ts's BORDER_WIDTH
// and DOT_SIZE already take.
const CONFIRM_BUTTON_FLEX = 1.4;

export const styles = StyleSheet.create({
  field: {
    marginBottom: SPACING['space/section'],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING['space/gap'],
  },
  cancelButton: {
    flex: 1,
  },
  confirmButton: {
    flex: CONFIRM_BUTTON_FLEX,
  },
});
