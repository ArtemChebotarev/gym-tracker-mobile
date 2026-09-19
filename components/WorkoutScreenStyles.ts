// Styles behind components/WorkoutScreen.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

// No tokens for these — the completed check is a small round accent mark next to the title (08.7,
// "Шапка"), sized to sit inside the `type/screen-title` line.
const COMPLETED_CHECK_SIZE = 22;
export const COMPLETED_CHECK_ICON_SIZE = 14;
const CARD_BORDER_WIDTH = 1;

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS['surface/page'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
  },
  completedCheck: {
    width: COMPLETED_CHECK_SIZE,
    height: COMPLETED_CHECK_SIZE,
    borderRadius: COMPLETED_CHECK_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING['space/gap'],
  },
  content: {
    paddingTop: SPACING['space/gap'],
    paddingBottom: SPACING['space/section'],
    gap: SPACING['space/row'],
  },
  // Stand-in for the exercise card (task 092 replaces it) — just enough to show the list.
  exerciseCard: {
    backgroundColor: COLORS['surface/card'],
    borderWidth: CARD_BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/control'],
    paddingHorizontal: SPACING['space/sheet'],
    paddingVertical: SPACING['space/row'],
  },
  exerciseName: {
    fontSize: TYPOGRAPHY['type/card-title'].fontSize,
    fontWeight: TYPOGRAPHY['type/card-title'].fontWeight,
    color: COLORS['text/primary'],
  },
  unlocksCaption: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS['text/faint'],
  },
});
