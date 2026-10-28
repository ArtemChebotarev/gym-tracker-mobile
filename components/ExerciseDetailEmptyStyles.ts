// Styles behind components/ExerciseDetailEmpty.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  empty: {
    gap: SPACING['space/gap-tight'],
    paddingVertical: SPACING['space/section'],
    alignItems: 'center',
  },
  // The fill and corner of the tiles and cards around it, its text on their inner padding.
  framed: {
    gap: SPACING['space/xs'],
    backgroundColor: COLORS['surface/card'],
    borderRadius: RADII['radius/field'],
    paddingHorizontal: SPACING['space/row'],
    paddingVertical: SPACING['space/row'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/secondary'],
    textAlign: 'center',
  },
  framedTitle: {
    color: COLORS['text/primary'],
    textAlign: 'left',
  },
  description: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/muted'],
    textAlign: 'center',
  },
  framedDescription: {
    textAlign: 'left',
  },
});
