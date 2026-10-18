// Styles behind components/SetsExerciseCard.tsx — see the code-style skill. The card's frame and
// its column header have their own (ExerciseCardFrameStyles.ts, ExerciseColumnHeaderStyles.ts).

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

// The small secondary text of the workout screen — same as the set rows (WorkoutSetRowStyles.ts).
const META_FONT_SIZE = TYPOGRAPHY['type/meta'].fontSize;

export const styles = StyleSheet.create({
  // The ⓘ popover's own content (08.7.1): the legend under the range track.
  // The steps of the plate shown when there is no history to read a range from.
  // Spaced like the recommended-weight plate's legend: `space/xl` above the block, `space/dots`
  // between its rows.
  popoverSteps: {
    marginTop: SPACING['space/xl'],
    gap: SPACING['space/dots'],
  },
  // The track's labels hang under it, so the full gap below them reads as more than the same gap
  // above the track — pulled in so the track sits evenly between the two blocks.
  popoverStepsAfterTrack: {
    marginTop: SPACING['space/md'],
  },
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
