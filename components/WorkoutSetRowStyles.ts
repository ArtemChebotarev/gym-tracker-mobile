// Styles behind components/WorkoutSetRow.tsx — see the code-style skill.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

// No tokens for these — 08.7 sizes the Log box as a 34pt square; the fields share its height so
// the row stays one line. The card's column header (WorkoutExerciseCardStyles.ts) reuses the
// number and Log column widths to line up with the rows.
export const LOG_BOX_SIZE = 34;
// The set number column — wide enough for two digits.
export const SET_NUMBER_WIDTH = 20;
export const LOG_CHECK_ICON_SIZE = 16;
const BORDER_WIDTH = 1;

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
  },
  setNumberColumn: {
    width: SET_NUMBER_WIDTH,
  },
  valueColumn: {
    flex: 1,
  },
  logColumn: {
    width: LOG_BOX_SIZE,
    alignItems: 'center',
  },
  setNumber: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    color: COLORS['text/faint'],
  },
  field: {
    height: LOG_BOX_SIZE,
    justifyContent: 'center',
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
    paddingHorizontal: SPACING['space/gap'],
  },
  // The TextInput is the field itself (with `field`), the way TextField does it.
  input: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    fontWeight: TYPOGRAPHY['type/value'].fontWeight,
    color: COLORS['text/primary'],
  },
  loggedValue: {
    height: LOG_BOX_SIZE,
    justifyContent: 'center',
    paddingHorizontal: SPACING['space/gap'],
  },
  value: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    fontWeight: TYPOGRAPHY['type/value'].fontWeight,
    color: COLORS['text/primary'],
  },
  placeholder: {
    fontSize: TYPOGRAPHY['type/value'].fontSize,
    fontWeight: TYPOGRAPHY['type/value'].fontWeight,
    color: COLORS['text/faint'],
  },
  repsValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING['space/gap-tight'],
  },
  indicator: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/muted'],
  },
  logBox: {
    width: LOG_BOX_SIZE,
    height: LOG_BOX_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
  },
  logBoxNext: {
    borderColor: COLORS.accent,
  },
  logBoxLogged: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  pressed: {
    opacity: 0.7,
  },
});

export const PLACEHOLDER_COLOR = COLORS['text/faint'];
