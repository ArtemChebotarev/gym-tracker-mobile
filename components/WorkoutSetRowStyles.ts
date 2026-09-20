// Styles behind components/WorkoutSetRow.tsx — see the code-style skill.
//
// Laid out after the 08.7 mockup's set table (08.7-workout-session.html), minus the set number
// (Artem's review): Weight and Reps sharing the width, the indicator 22, Log 38 — everything
// centered, with a subtle divider above each row. The card's column header
// (WorkoutExerciseCardStyles.ts) reuses the fixed column widths to line up with the rows.

import { StyleSheet } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import { square } from '@design/shapes';

// The small secondary text of the workout screen (the indicator, equipment, notes) is `type/meta`;
// the column widths are shared with the card's header row through `SIZES`.
const META_FONT_SIZE = TYPOGRAPHY['type/meta'].fontSize;
const VALUE_FONT_SIZE = TYPOGRAPHY['type/set-value'].fontSize;

export const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap'],
    paddingVertical: SPACING['space/set-row-y'],
    borderTopWidth: BORDER_WIDTHS['border/default'],
    borderTopColor: COLORS['border/divider-subtle'],
  },
  // Weight and Reps: the field frame, also kept (without fill or outline) for a logged value so
  // the row doesn't jump when a set is logged.
  field: {
    flex: 1,
    height: SIZES['size/cell'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER_WIDTHS['border/default'],
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
    fontSize: VALUE_FONT_SIZE,
    color: COLORS['text/primary'],
  },
  value: {
    fontSize: VALUE_FONT_SIZE,
    color: COLORS['text/primary'],
  },
  placeholder: {
    fontSize: VALUE_FONT_SIZE,
    color: COLORS['text/disabled'],
  },
  // `N RIR` doesn't fit at the value size.
  placeholderRir: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
  },
  // A skipped row's `Skipped` spans the Weight and Reps columns, at the fields' height so the row
  // lines up with the logged ones around it.
  skippedValues: {
    flex: 2,
    height: SIZES['size/cell'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  skippedLabel: {
    fontSize: META_FONT_SIZE,
    color: COLORS['text/muted'],
  },
  indicator: {
    width: SIZES['size/indicator-column'],
    textAlign: 'center',
    fontSize: META_FONT_SIZE,
    color: COLORS['text/muted'],
  },
  // On target or over it reads a step brighter than under it — still neutral text (08.7).
  indicatorStrong: {
    color: COLORS['text/secondary'],
  },
  logColumn: {
    width: SIZES['size/log-column'],
    alignItems: 'flex-end',
  },
  logBox: {
    ...square(SIZES['size/log-box']),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: BORDER_WIDTHS['border/default'],
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
    opacity: OPACITY['opacity/pressed'],
  },
});

export const PLACEHOLDER_COLOR = COLORS['text/disabled'];
