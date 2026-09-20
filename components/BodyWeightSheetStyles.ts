// Styles behind components/BodyWeightSheet.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  content: {
    gap: SPACING['space/section'],
  },
  note: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
});
