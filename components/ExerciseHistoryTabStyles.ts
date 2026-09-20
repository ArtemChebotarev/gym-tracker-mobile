// Styles behind components/ExerciseHistoryTab.tsx — see the code-style skill.
//
// The section headers are SectionHeader's own, which pads itself by `space/screen` so it can span
// the full width under a screen that pads its content. This tab sits inside the Exercise screen's
// padded container instead, so the headers are pulled back out to the screen edge by that same
// token — a sticky header that stops short of the edge reads as a floating card, not a header.

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
  headerBleed: {
    marginHorizontal: -SPACING['space/screen'],
    marginTop: SPACING['space/gap'],
  },
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
});
