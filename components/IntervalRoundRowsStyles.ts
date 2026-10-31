// Styles behind components/IntervalRoundRows.tsx — see the code-style skill. A round row stands on
// the set rows' grid (WorkoutSetRowStyles.ts), whose field, value and Log box it reuses, so the
// columns of every card on the screen line up; only the hint under the rounds is its own.

import { StyleSheet } from 'react-native';

import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // Why Log and Start timer wait (GT-187): `text/secondary`, since the quieter greys don't read on
  // the device.
  hint: {
    paddingVertical: SPACING['space/gap-tight'],
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
});
