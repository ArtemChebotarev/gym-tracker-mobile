// Styles behind components/StorageGate.tsx — see the `code-style` skill.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/screen'],
    gap: SPACING['space/gap-tight'],
    backgroundColor: COLORS['surface/page'],
  },
  title: {
    fontSize: TYPOGRAPHY['type/entity-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/entity-title'].fontWeight,
    color: COLORS['text/primary'],
    textAlign: 'center',
  },
  description: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
    textAlign: 'center',
  },
});
