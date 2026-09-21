// Styles behind components/DebugScreen.tsx — see the `code-style` skill.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  body: {
    gap: SPACING['space/section'],
  },
  description: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
  error: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS.danger,
  },
});
