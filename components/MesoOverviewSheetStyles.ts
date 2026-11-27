// Styles behind components/MesoOverviewSheet.tsx — see the code-style skill.
//
// The grid's own styles moved to MesoGridStyles.ts with the component (task 127); what's left is
// the sheet's own chrome.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // Cycle length sits under the grid as its own block (GT-240), the way a field follows another.
  length: {
    marginTop: SPACING['space/section'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
