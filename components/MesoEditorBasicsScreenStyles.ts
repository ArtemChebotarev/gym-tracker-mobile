// Styles for MesoEditorBasicsScreen.tsx — see the code-style skill, "Screens keep the same
// split, one level up". The header/title/progress-bar chrome now lives in
// design/components/WizardHeader.tsx (task 076 review) — its own styles moved with it.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING } from '@design/tokens';

// Mockup (01-new-meso-basics.html): .content's 4px top padding, .footer's 24px bottom padding
// and 1px top divider. No token exists yet at either size — same exception
// ExerciseFormSheetStyles.ts's FIELDS_MIN_HEIGHT and ExerciseFiltersSheetStyles.ts's
// BORDER_WIDTH/DOT_SIZE already take.
const CONTENT_PADDING_TOP = 4;
const FOOTER_PADDING_BOTTOM = 24;
const FOOTER_BORDER_WIDTH = 1;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS['surface/page'],
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: CONTENT_PADDING_TOP,
  },
  section: {
    marginBottom: SPACING['space/section'],
  },
  footer: {
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/screen'],
    paddingBottom: FOOTER_PADDING_BOTTOM,
    borderTopWidth: FOOTER_BORDER_WIDTH,
    borderTopColor: COLORS['border/divider'],
  },
});
