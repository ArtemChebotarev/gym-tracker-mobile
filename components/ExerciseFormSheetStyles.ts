// Styles for ExerciseFormSheet.tsx — see the code-style skill, "Screens keep the same split, one
// level up".

import { StyleSheet } from 'react-native';

import { SIZES, SPACING } from '@design/tokens';

// Matches 03-new-exercise.html's .btn.p{flex:1.4} beside a flex:1 Cancel — the confirming
// button reads wider than Cancel. A flex ratio isn't a size or a color, so it stays a local
// constant rather than a design token.
const CONFIRM_BUTTON_FLEX = 1.4;

export const styles = StyleSheet.create({
  // Reserves roughly the three collapsed fields plus one open Dropdown panel's worth of height
  // (`size/form-fields`) up front, so opening Muscle group or Equipment fills already-reserved
  // space instead of growing the sheet itself — without this, the sheet starts noticeably short
  // and then jumps taller the moment either dropdown opens.
  fields: {
    minHeight: SIZES['size/form-fields'],
  },
  field: {
    marginBottom: SPACING['space/section'],
  },
  // `flex: 1` here (not just on the two buttons inside) is what actually stretches this row to
  // the footer's full width — BottomSheet's footer is a row with `justifyContent: 'flex-end'`,
  // so a child with no flex/width of its own shrinks to its content size instead of filling the
  // row, and the two flex:1/1.4 buttons inside then have nothing to grow into. Same fix
  // ExerciseFiltersSheetStyles.ts's single-button footerButton already applies.
  buttonRow: {
    flex: 1,
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
