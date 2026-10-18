// Styles behind components/CorridorStepsPopover.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { SPACING } from '@design/tokens';

export const styles = StyleSheet.create({
  // Spaced like the recommended-weight plate's legend: `space/xl` above the block, `space/dots`
  // between its rows.
  steps: {
    marginTop: SPACING['space/xl'],
    gap: SPACING['space/dots'],
  },
  // The track's labels hang under it, so the full gap below them reads as more than the same gap
  // above the track — pulled in so the track sits evenly between the two blocks.
  stepsAfterTrack: {
    marginTop: SPACING['space/md'],
  },
});
