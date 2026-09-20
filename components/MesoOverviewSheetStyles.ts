// Styles behind components/MesoOverviewSheet.tsx — see the code-style skill.
//
// Laid out after the 08.7 mockup's overview sheet (08.7-workout-session.html): a 52pt week column,
// then one equal column per day; 40pt cells at `radius/field`, 6pt apart; the legend under the grid.
//
// Task 107 cut the six cell looks down to three (08.7's cell-state table): a finished day is a
// filled cell with a check, everything left to do is a plain outline, and the day the workout
// screen has open is ringed in white over either of them. The old looks were six shades of grey
// between 1.03:1 and 1.33:1 against `surface/sheet` — indistinguishable on a real phone. These
// three differ by fill vs outline vs ring, and each clears WCAG 1.4.11's 3:1 against the sheet
// (3.2:1 fill, 3.5:1 outline, 16:1 ring). The legend's swatches are the cell treatments themselves
// at 22pt, so the mapping needs no learning.
//
// Every label here is near-white (Artem's review): the muted and faint greys this sheet used sat
// at 3.5–5.5:1, under the 4.5:1 WCAG asks of text this small, and on a phone they disappeared.

import { StyleSheet, type ViewStyle } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import { square } from '@design/shapes';

const CELL_BORDER_WIDTH = BORDER_WIDTHS['border/default'];

const SMALL_TEXT = TYPOGRAPHY['type/meta'].fontSize;

export const styles = StyleSheet.create({
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/secondary'],
  },
  grid: {
    gap: SPACING['space/gap-tight'],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  weekColumn: {
    width: SIZES['size/week-column'],
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: SMALL_TEXT,
    color: COLORS['text/primary'],
  },
  weekLabel: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/primary'],
  },
  deloadLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/secondary'],
  },
  cell: {
    flex: 1,
    height: SIZES['size/cell'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII['radius/field'],
    borderWidth: CELL_BORDER_WIDTH,
    borderColor: 'transparent',
  },
  /** A day behind you — trained or skipped alike. */
  cellFinished: {
    backgroundColor: COLORS['surface/cell-done'],
  },
  /** Everything still to do, whether it's programmed yet or not. */
  cellLeft: {
    borderColor: COLORS['border/cell-quiet'],
  },
  cellPressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  openRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADII['radius/field'] - CELL_BORDER_WIDTH,
    borderWidth: BORDER_WIDTHS['border/emphasis'],
    borderColor: COLORS['text/primary'],
    pointerEvents: 'none',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: SPACING['space/row'],
    columnGap: SPACING['space/legend'],
    marginTop: SPACING['space/legend'],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING['space/gap-tight'],
  },
  legendLabel: {
    fontSize: SMALL_TEXT,
    color: COLORS['text/primary'],
  },
  swatch: {
    ...square(SIZES['size/swatch']),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII['radius/small'],
    borderWidth: CELL_BORDER_WIDTH,
    borderColor: 'transparent',
  },
});

/** The three cell looks (08.7, task 107) — `openRing` goes on top of whichever applies. */
export const CELL_FINISHED_STYLE: ViewStyle = styles.cellFinished;
export const CELL_LEFT_STYLE: ViewStyle = styles.cellLeft;
