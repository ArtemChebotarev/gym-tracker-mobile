// Styles for MesoTemplateStep.tsx — see the code-style skill. The same content padding as
// MesoSourceWeekStepStyles.ts and MesoEditorBasicsStepStyles.ts: step T sits in front of Basics in
// the same mounted wizard, so its content starts where theirs does.

import { StyleSheet } from 'react-native';

import { SPACING } from '@design/tokens';

export const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: SPACING['space/gap'],
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/xs'],
  },
});
