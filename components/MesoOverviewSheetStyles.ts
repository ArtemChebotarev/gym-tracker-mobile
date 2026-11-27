// Styles behind components/MesoOverviewSheet.tsx — see the code-style skill.
//
// The grid's own styles moved to MesoGridStyles.ts with the component (task 127); what's left is
// the sheet's own chrome.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // Cycle length sits under the grid as its own block (GT-240), the way a field follows another.
  // A row under the grid, set off by a divider (GT-240, variant A2): the label on the left, the
  // inline stepper on the right. Its buttons grey out at the block's bounds; nothing spells them out.
  length: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/row'],
    marginTop: SPACING['space/section'],
    paddingTop: SPACING['space/section'],
    borderTopWidth: BORDER_WIDTHS['border/default'],
    borderTopColor: COLORS['border/divider-subtle'],
  },
  lengthLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/primary'],
  },
  // The unit after the label, in grey — as `StepperRow` qualifies its label.
  lengthUnit: {
    color: COLORS['text/secondary'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
