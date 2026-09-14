// Styles for MesoEditorFooter.tsx — see the code-style skill, "Screens keep the same split, one
// level up".

import { StyleSheet } from 'react-native';

import { COLORS, TYPOGRAPHY } from '@design/tokens';

// Mockup (02-new-meso-days.html): .footer-hint's 10px margin-top. No token exists for it — same
// exception the rest of this flow's screens already take for a handful of one-off sizes.
const HINT_MARGIN_TOP = 10;

export const styles = StyleSheet.create({
  hint: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
    textAlign: 'center',
    marginTop: HINT_MARGIN_TOP,
  },
});
