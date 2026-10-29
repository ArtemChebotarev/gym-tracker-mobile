// Styles behind components/PowerExerciseCard.tsx — see the code-style skill. The card's frame, its
// column header and the Fast reps plate have their own.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

// The small secondary text of the workout screen — same as the set rows (WorkoutSetRowStyles.ts).
const META_FONT_SIZE = TYPOGRAPHY['type/meta'].fontSize;

export const styles = StyleSheet.create({
  // The note's links stand in one row — Replace exercise · Hide this tip — and wrap on a narrow card.
  ceilingLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: SPACING['space/gap'],
    marginTop: SPACING['space/gap-tight'],
  },
  ceilingFlag: {
    paddingVertical: SPACING['space/gap-tight'],
  },
  ceilingFlagText: {
    fontSize: META_FONT_SIZE,
    color: COLORS['text/secondary'],
    textDecorationLine: 'underline',
  },
});
