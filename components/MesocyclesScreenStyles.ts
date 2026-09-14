// Styles behind components/MesocyclesScreen.tsx — see the `code-style` skill and
// ExerciseLibraryScreenStyles.ts's `addIcon` for why the "+" button is styled this way.

import { StyleSheet } from 'react-native';

import { COLORS, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  addIcon: {
    fontSize: TYPOGRAPHY['type/entity-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/entity-title'].fontWeight,
    color: COLORS['accent/on'],
  },
  placeholder: {
    color: COLORS['text/faint'],
  },
});
