// Styles behind components/ExerciseHistoryTab.tsx — see the code-style skill.
//
// The section headers are SectionHeader's own; the list bleeds to the screen edge and re-pads its
// content (`listBleed`), so the header band spans the screen while its text lines up with the
// session cards under it.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    gap: SPACING['space/gap'],
    paddingBottom: SPACING['space/section'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
