// Styles for ExerciseCreateScreen.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { SPACING } from '@design/tokens';

export const styles = StyleSheet.create({
  content: {
    // The wizard header draws no progress bar for a single step, so the fields need their own air.
    paddingTop: SPACING['space/screen'],
    paddingHorizontal: SPACING['space/screen'],
    paddingBottom: SPACING['space/xl'],
  },
});
