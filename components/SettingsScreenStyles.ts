// Styles behind components/SettingsScreen.tsx — a section as canvas 5.x draws it: its label in
// caps, a card of rows split by dividers, and a grey note under the card.

import { StyleSheet } from 'react-native';

import { fieldStyles } from '@design/components/fieldStyles';
import { BORDER_WIDTHS, COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  section: {
    gap: SPACING['space/gap-tight'],
    paddingTop: SPACING['space/section'],
  },
  sectionLabel: {
    ...fieldStyles.label,
    marginBottom: 0,
  },
  card: {
    backgroundColor: COLORS['surface/card'],
    borderRadius: RADII['radius/field'],
    paddingHorizontal: SPACING['space/md'],
  },
  toggleRow: {
    paddingVertical: SPACING['space/row'],
  },
  rowDivider: {
    borderBottomWidth: BORDER_WIDTHS['border/default'],
    borderBottomColor: COLORS['border/divider-subtle'],
  },
  note: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    color: COLORS['text/muted'],
  },
});
