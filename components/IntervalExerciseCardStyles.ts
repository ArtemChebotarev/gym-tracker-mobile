// Styles behind components/IntervalExerciseCard.tsx — see the code-style skill. The card's frame, its
// column header and its rounds have their own.

import { StyleSheet } from 'react-native';

import { COLORS, LINE_HEIGHTS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // The plate's blocks and rows are spaced as every plate's: `space/xl`, `space/dots` (08.11).
  findingRows: {
    marginTop: SPACING['space/xl'],
    gap: SPACING['space/dots'],
  },
  // At the top: the chip stands at its text's first line, as a PlateRow's mark does.
  findingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING['space/gap'],
  },
  findingText: {
    flex: 1,
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    fontWeight: TYPOGRAPHY['type/meta'].fontWeight,
    lineHeight: LINE_HEIGHTS['line-height/text'],
    color: COLORS['text/secondary'],
  },
  findingProgression: {
    marginTop: SPACING['space/xl'],
  },
});
