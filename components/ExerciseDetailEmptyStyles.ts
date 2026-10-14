// Styles behind components/ExerciseDetailEmpty.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  empty: {
    gap: SPACING['space/gap-tight'],
    paddingVertical: SPACING['space/section'],
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/secondary'],
    textAlign: 'center',
  },
  description: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/muted'],
    textAlign: 'center',
  },
});
