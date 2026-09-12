// Shared "field chrome" for form controls that pair a caption label with a bordered box and an
// optional inline error — used by TextField and Dropdown so the two components stay visually
// identical without each hand-copying the same StyleSheet blocks (see 08.0 · Design SDK).
// Text-specific styling (the actual input/value typography) stays local to each component,
// since that part genuinely differs between an editable TextInput and a static value/placeholder.

import { StyleSheet } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../tokens';

export const fieldStyles = StyleSheet.create({
  label: {
    fontSize: TYPOGRAPHY['type/label'].fontSize,
    fontWeight: TYPOGRAPHY['type/label'].fontWeight,
    letterSpacing: TYPOGRAPHY['type/label'].letterSpacing,
    textTransform: TYPOGRAPHY['type/label'].textTransform,
    color: COLORS['text/muted'],
    marginBottom: SPACING['space/gap-tight'],
  },
  box: {
    borderWidth: 1,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    backgroundColor: COLORS['surface/card'],
    paddingHorizontal: SPACING['space/gap'],
    paddingVertical: SPACING['space/row'],
  },
  boxError: {
    borderColor: COLORS['danger/border'],
  },
  error: {
    marginTop: SPACING['space/gap-tight'],
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS.danger,
  },
});
