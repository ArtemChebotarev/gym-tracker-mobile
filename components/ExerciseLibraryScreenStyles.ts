// Styles for ExerciseLibraryScreen.tsx — see AGENTS.md, "Code organization" ("Screens keep the
// same split, one level up.").

import { StyleSheet } from 'react-native';

import { COLORS, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  addIcon: {
    fontSize: TYPOGRAPHY['type/entity-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/entity-title'].fontWeight,
    color: COLORS['accent/on'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
  },
});
