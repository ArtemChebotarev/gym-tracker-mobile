// Styles behind components/WorkoutScreen.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import { circle } from '@design/shapes';

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
    // A small round accent mark next to the title (08.7, "Шапка"), sized to sit inside the
    // `type/screen-title` line.
    ...circle(SIZES['size/badge']),
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
  finish: {
    paddingTop: SPACING['space/gap'],
  },
  unlocksCaption: {
    paddingTop: SPACING['space/gap'],
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/faint'],
  },
});
