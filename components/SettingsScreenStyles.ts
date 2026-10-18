// Styles behind components/SettingsScreen.tsx. Plain on purpose: the screen's design is its own
// task; this only lays out what GT-87 needs, from SDK pieces.

import { StyleSheet } from 'react-native';

import { fieldStyles } from '@design/components/fieldStyles';
import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  section: {
    gap: SPACING['space/gap'],
  },
  sectionLabel: {
    ...fieldStyles.label,
    marginBottom: 0,
  },
  note: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/secondary'],
  },
});
