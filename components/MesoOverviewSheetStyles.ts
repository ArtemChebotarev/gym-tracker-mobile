// Styles behind components/MesoOverviewSheet.tsx — see the code-style skill.
//
// The grid's own styles moved to MesoGridStyles.ts with the component (task 127); what's left is
// the sheet's own chrome.

import { StyleSheet } from 'react-native';

import { COLORS, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
