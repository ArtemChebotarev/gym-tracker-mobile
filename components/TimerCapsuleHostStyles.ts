import { StyleSheet } from 'react-native';

import { SPACING } from '@design/tokens';

export const TimerCapsuleHostStyles = StyleSheet.create({
  // Set in from the edges like the bar under it, and as far above the bar as the bar is above the
  // home indicator.
  slot: {
    paddingHorizontal: SPACING['space/screen'],
    paddingBottom: SPACING['space/gap-tight'],
  },
});
