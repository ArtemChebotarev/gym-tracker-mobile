// Styles for MesoSourceWeekStep.tsx — see the code-style skill, "Screens keep the same split,
// one level up". Deliberately the same content padding and section rhythm as
// MesoEditorBasicsStepStyles.ts: step S sits in front of Basics in the same mounted wizard, and
// its fields should land where Basics' do rather than shift as the user moves between them.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: SPACING['space/screen'],
    paddingTop: SPACING['space/xs'],
  },
  section: {
    marginBottom: SPACING['space/section'],
  },
  // The line under the Week field. `text/secondary`, not `text/muted` or `text/faint` — those
  // two are unreadable on the device (Artem, on 08.0's text scale), and this line carries the
  // reason deload weeks are missing, which is not a detail to lose.
  hint: {
    marginTop: SPACING['space/gap-tight'],
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  emptyHint: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
});
