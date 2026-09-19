// Styles behind components/MesoOverviewSheet.tsx — see the code-style skill.
//
// Laid out after the 08.7 mockup's overview sheet (08.7-workout-session.html): a 52pt week column,
// then one equal column per day; 40pt cells at `radius/field`, 6pt apart; the legend's 14pt
// swatches under the grid. Cell looks follow 08.7's cell-state table.

import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import type { MesoGridCellStatus } from '@domain/mesoGrid';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import { square } from '@design/shapes';

const CELL_BORDER_WIDTH = BORDER_WIDTHS['border/default'];

const SMALL_TEXT = TYPOGRAPHY['type/label'].fontSize;

export const styles = StyleSheet.create({
  status: {
    fontSize: TYPOGRAPHY['type/body'].fontSize,
    color: COLORS['text/faint'],
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
    color: COLORS['text/muted'],
  },
  weekLabel: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/muted'],
  },
  deloadLabel: {
    fontSize: TYPOGRAPHY['type/caption'].fontSize,
    color: COLORS['text/faint'],
  },
  cell: {
    flex: 1,
    height: SIZES['size/cell'],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII['radius/field'],
    borderWidth: CELL_BORDER_WIDTH,
    borderColor: 'transparent',
    backgroundColor: COLORS['surface/card'],
  },
  cellCompleted: {
    backgroundColor: COLORS['surface/control-active'],
  },
  cellInProgress: {
    borderColor: COLORS.accent,
  },
  cellAwaiting: {
    backgroundColor: 'transparent',
    borderColor: COLORS['border/default'],
    borderStyle: 'dashed',
  },
  cellPressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  openRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADII['radius/field'] - CELL_BORDER_WIDTH,
    borderWidth: BORDER_WIDTHS['border/emphasis'],
    borderColor: COLORS['text/muted'],
    pointerEvents: 'none',
  },
  cellText: {
    fontSize: SMALL_TEXT,
    color: COLORS['text/secondary'],
  },
  cellTextInProgress: {
    color: COLORS.accent,
  },
  cellTextSkipped: {
    color: COLORS['text/faint'],
    textDecorationLine: 'line-through',
  },
  cellTextAwaiting: {
    color: COLORS['text/disabled'],
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
    color: COLORS['text/faint'],
  },
  swatch: {
    ...square(SIZES['size/swatch']),
    borderRadius: RADII['radius/small'],
    borderWidth: CELL_BORDER_WIDTH,
    borderColor: 'transparent',
  },
  swatchCompleted: {
    backgroundColor: COLORS['surface/control-active'],
  },
  swatchInProgress: {
    borderColor: COLORS.accent,
  },
  swatchReady: {
    backgroundColor: COLORS['surface/card'],
  },
  swatchAwaiting: {
    borderColor: COLORS['border/default'],
    borderStyle: 'dashed',
  },
});

/** A cell's frame per state, over `styles.cell` — ready and skipped keep the plain card. */
export const CELL_STATUS_STYLES: Partial<Record<MesoGridCellStatus, ViewStyle>> = {
  completed: styles.cellCompleted,
  in_progress: styles.cellInProgress,
  awaiting: styles.cellAwaiting,
};

/** A cell's text per state, over `styles.cellText`. */
export const CELL_TEXT_STATUS_STYLES: Partial<Record<MesoGridCellStatus, TextStyle>> = {
  in_progress: styles.cellTextInProgress,
  skipped: styles.cellTextSkipped,
  awaiting: styles.cellTextAwaiting,
};

/** The legend (08.7): what each swatch stands for, in order. */
export const LEGEND_ITEMS: readonly { label: string; swatch: ViewStyle }[] = [
  { label: 'Completed', swatch: styles.swatchCompleted },
  { label: 'In progress', swatch: styles.swatchInProgress },
  { label: 'Ready', swatch: styles.swatchReady },
  { label: 'Not programmed yet', swatch: styles.swatchAwaiting },
];
