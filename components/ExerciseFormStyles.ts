// Styles for ExerciseFormScreen.tsx — see the code-style skill, "Screens keep the same split, one
// level up".

import { StyleSheet } from 'react-native';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // Reserves roughly the three collapsed fields plus one open Dropdown panel's worth of height
  // (`size/form-fields`) up front, so opening Muscle group or Equipment fills already-reserved
  // space instead of growing the sheet itself — without this, the sheet starts noticeably short
  // and then jumps taller the moment either dropdown opens.
  fields: {
    minHeight: SIZES['size/form-fields'],
  },
  // The one line over a group of options that says what holds for all of them (canvas 4.3).
  hint: {
    ...TYPOGRAPHY['type/meta'],
    color: COLORS['text/muted'],
    marginBottom: SPACING['space/row'],
  },
  // The line under the step control (canvas 4.3): what the step is.
  stepHint: {
    ...TYPOGRAPHY['type/meta'],
    color: COLORS['text/muted'],
    marginTop: SPACING['space/gap-tight'],
  },
  // Room between the load hint and the Rest row under it.
  loadHint: {
    marginBottom: SPACING['space/section'],
  },
  progressionStep: {
    marginTop: SPACING['space/section'],
  },
  field: {
    marginBottom: SPACING['space/section'],
  },
});
