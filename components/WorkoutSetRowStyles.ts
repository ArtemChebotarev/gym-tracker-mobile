// Styles behind components/WorkoutSetRow.tsx — see the code-style skill.
//
// Laid out after the 08.7 mockup (08.7-workout-session.html): a five-column grid — set number 18,
// Weight and Reps sharing the rest, the indicator 22, Log 38 — with everything centered, and a
// subtle divider above each row. The card's column header (WorkoutExerciseCardStyles.ts) reuses
// the fixed column widths to line up with the rows.

import { StyleSheet } from 'react-native';

import { COLORS, RADII, SPACING, TYPOGRAPHY } from '@design/tokens';

// No tokens for these — the 08.7 mockup sizes them directly.
export const SET_NUMBER_WIDTH = 18;
export const INDICATOR_WIDTH = 22;
export const LOG_COLUMN_WIDTH = 38;
const LOG_BOX_SIZE = 34;
const FIELD_HEIGHT = 40;
const FIELD_FONT_SIZE = 17;
/** The small secondary text of the workout screen: set numbers, the indicator, equipment. */
export const SMALL_FONT_SIZE = 12;
export const LOG_CHECK_ICON_SIZE = 16;
const BORDER_WIDTH = 1;

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    paddingVertical: SPACING['space/gap-tight'],
    borderTopWidth: BORDER_WIDTH,
    borderTopColor: COLORS['border/divider-subtle'],
  },
  setNumber: {
    width: SET_NUMBER_WIDTH,
    textAlign: 'center',
    fontSize: SMALL_FONT_SIZE,
    color: COLORS['text/faint'],
  },
  // Weight and Reps: the field frame, also kept (without fill or outline) for a logged value so
  // the row doesn't jump when a set is logged.
  field: {
    flex: 1,
    height: FIELD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER_WIDTH,
    borderColor: COLORS['border/default'],
    borderRadius: RADII['radius/field'],
  },
  // One tone darker than the card, so an editable field reads as a place to type (Artem's review
  // picked `surface/raised` over the mockup's `surface/page`); read-only rows keep the bare outline.
  fieldEditable: {
    backgroundColor: COLORS['surface/raised'],
  },
  fieldFocused: {
    borderColor: COLORS['text/muted'],
  },
  fieldLogged: {
    borderColor: 'transparent',
  },
  input: {
    textAlign: 'center',
    fontSize: FIELD_FONT_SIZE,
    color: COLORS['text/primary'],
  },
  value: {
    fontSize: FIELD_FONT_SIZE,
    color: COLORS['text/primary'],
  },
  placeholder: {
    fontSize: FIELD_FONT_SIZE,
    color: COLORS['text/disabled'],
  },
  // `N RIR` doesn't fit at the value size.
  placeholderRir: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
  },
  indicator: {
    width: INDICATOR_WIDTH,
    textAlign: 'center',
    fontSize: SMALL_FONT_SIZE,
    color: COLORS['text/muted'],
  },
  // On target or over it reads a step brighter than under it — still neutral text (08.7).
  indicatorStrong: {
    color: COLORS['text/secondary'],
  },
  logColumn: {
    width: LOG_COLUMN_WIDTH,
    alignItems: 'flex-end',
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

export const PLACEHOLDER_COLOR = COLORS['text/disabled'];
