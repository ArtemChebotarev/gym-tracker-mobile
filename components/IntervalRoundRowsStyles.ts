// Styles behind components/IntervalRoundRows.tsx — see the code-style skill. A round row stands on
// the set rows' grid (WorkoutSetRowStyles.ts), whose field, value and Log box it reuses, so the
// columns of every card on the screen line up; only what is the round's own lives here.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

export const styles = StyleSheet.create({
  // The round number: a plain value, one step quieter than the times beside it.
  roundCell: {
    flex: 1,
    height: SIZES['size/cell'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundNumber: {
    fontSize: TYPOGRAPHY['type/set-value'].fontSize,
    color: COLORS['text/secondary'],
  },
  // Why Log and Start timer wait (GT-187): `text/secondary`, since the quieter greys don't read on
  // the device.
  hint: {
    paddingTop: SPACING['space/gap-tight'],
    textAlign: 'center',
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/secondary'],
  },
  startTimerDisabled: {
    opacity: OPACITY['opacity/dimmed'],
  },
  // Start timer (FR-14): dressed like the Done cell of the week grid — `accent/bg` fill, the
  // `accent/border` outline, lime text — so it reads as the card's action without a second
  // full-accent button on the screen.
  startTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING['space/gap-tight'],
    marginTop: SPACING['space/gap-tight'],
    marginBottom: SPACING['space/xs'],
    paddingVertical: SPACING['space/button'],
    borderRadius: RADII['radius/control'],
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: COLORS['accent/border'],
    backgroundColor: COLORS['accent/bg'],
  },
  startTimerLabel: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    fontWeight: TYPOGRAPHY['type/body'].fontWeight,
    color: COLORS.accent,
  },
  pressed: {
    opacity: OPACITY['opacity/pressed'],
  },
});
