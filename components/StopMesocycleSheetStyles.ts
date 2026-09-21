// Styles behind components/StopMesocycleSheet.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  content: {
    gap: SPACING['space/section'],
  },
  warning: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
