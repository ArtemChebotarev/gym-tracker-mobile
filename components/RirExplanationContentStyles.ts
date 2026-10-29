import { StyleSheet } from 'react-native';

import { SPACING } from '@design/tokens';

export const styles = StyleSheet.create({
  root: {
    gap: SPACING['space/md'],
  },
  rows: {
    gap: SPACING['space/gap'],
  },
  // With no track (power's Deload plate) the rows come right under the title, so they take the gap
  // the track would have: `RangeTrack`'s own top margin (Artem's review, 18.10.2026).
  rowsUnderTitle: {
    marginTop: SPACING['space/xl'],
  },
});
