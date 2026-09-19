// Styles for MesoEditorBasicsStep.tsx — see the code-style skill, "Screens keep the same split,
// one level up". The header/progress-bar/footer chrome's own styles live in
// design/components/WizardScreen.tsx (task 076 review) — only this step's own content styling
// stays here.

import { StyleSheet } from 'react-native';

import { SPACING } from '@design/tokens';

export const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: SPACING['space/screen'],
    // Mockup (01-new-meso-basics.html): .content's 4px top padding.
    paddingTop: SPACING['space/xs'],
  },
  section: {
    marginBottom: SPACING['space/section'],
  },
});
