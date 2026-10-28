// Styles behind components/ExerciseDetailEmpty.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // The fill and corner of the tiles and cards around it, its text on their inner padding.
  empty: {
    gap: SPACING['space/xs'],
    backgroundColor: COLORS['surface/card'],
    borderRadius: RADII['radius/field'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/row'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  description: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/muted'],
  },
});
