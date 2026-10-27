// Styles behind components/MobilityBlockRow.tsx — see the code-style skill. The row stands on the
// set rows' grid (WorkoutSetRowStyles.ts), whose field and Done box it reuses; only the round play
// button's slot is its own.
//
// Play and Done sit in the columns of the card's history and `⋯` buttons above them (Artem's review,
// 27.10.2026): the header has two `size/icon-button` circles `space/gap-tight` apart, and the Log
// column is as wide as one circle and that gap together — so play, flush against it with no gap of
// its own, centres under the history button, and Done stays where every card's Log box is.

import { StyleSheet } from 'react-native';

import { SIZES } from '@design/tokens';

export const styles = StyleSheet.create({
  // Play and Done together, with no gap between them — see the top of the file.
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Holds the round button's place once the block is done, so the field doesn't widen under it.
  buttonSlot: {
    width: SIZES['size/icon-button'],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
