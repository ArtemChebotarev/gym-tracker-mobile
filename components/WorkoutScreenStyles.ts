// Styles behind components/WorkoutScreen.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

// No tokens for these — the completed check is a small round accent mark next to the title (08.7,
// "Шапка"), sized to sit inside the `type/screen-title` line.
const COMPLETED_CHECK_SIZE = 22;
export const COMPLETED_CHECK_ICON_SIZE = 14;
const UNLOCKS_FONT_SIZE = 12;

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
  // The progress bar and the exercise list run edge to edge (08.7 mockup), out of RootScreen's
  // screen padding; the list's sections pad their own content.
  fullBleed: {
    marginHorizontal: -SPACING['space/screen'],
  },
  list: {
    flex: 1,
  },
  content: {
    paddingBottom: SPACING['space/section'],
  },
  unlocksCaption: {
    paddingTop: SPACING['space/section'],
    paddingHorizontal: SPACING['space/screen'],
    textAlign: 'center',
    fontSize: UNLOCKS_FONT_SIZE,
    color: COLORS['text/faint'],
  },
});
