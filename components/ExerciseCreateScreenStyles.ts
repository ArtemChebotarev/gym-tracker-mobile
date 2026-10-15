// Styles for ExerciseCreateScreen.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SPACING['space/screen'],
    paddingBottom: SPACING['space/xl'],
  },
  // The chosen type, under the wizard's heading (canvas 4.2: the type chip in the header).
  type: {
    ...TYPOGRAPHY['type/meta'],
    color: COLORS['text/muted'],
    marginBottom: SPACING['space/section'],
  },
});
