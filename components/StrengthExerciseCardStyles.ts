// Styles behind components/StrengthExerciseCard.tsx — see the code-style skill. The card's frame,
// its column header and the corridor plate have their own.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

// The small secondary text of the workout screen — same as the set rows (WorkoutSetRowStyles.ts).
const META_FONT_SIZE = TYPOGRAPHY['type/meta'].fontSize;

export const styles = StyleSheet.create({
  // The ⓘ popover's own content (08.7.1): the legend under the range track.
  legend: {
    marginTop: SPACING['space/xl'],
    gap: SPACING['space/dots'],
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  legendLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  legendValue: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/primary'],
  },
  weightHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
    marginTop: SPACING['space/gap-tight'],
  },
  weightHintText: {
    flex: 1,
    fontSize: META_FONT_SIZE,
    color: COLORS['text/secondary'],
  },
});
