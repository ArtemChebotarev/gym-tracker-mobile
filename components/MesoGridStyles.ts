// Styles behind components/MesoGrid.tsx — see the code-style skill.
//
// Laid out after the 08.7 mockup (08.7-grid-redesign.html): a week column, then one equal column
// per day; `size/cell` cells at `radius/field`, a tight gap apart.
//
// Three cell looks (08.7's cell-state table). Task 107 first cut six greys down to three shapes;
// the redesign of 25.09.2026 (task 127) moved the two that carry meaning into the accent family,
// because a grid of greys said nothing at a glance on a real phone:
//
// - Done — `accent/bg` fill, 1pt `accent/border`, an `accent` check. The check clears ~12:1 on the
//   fill. The cell's own shape sits at ~1.9:1 against `surface/sheet`, under WCAG 1.4.11's 3:1;
//   accepted knowingly (Artem's call), because the meaning is carried by the check, not the shape.
// - Skip — the word `Skip`, struck through, `text/muted`, `type/meta`, no fill and no outline.
//   ~5.5:1 against the sheet, and different in kind from both other looks.
// - Left to do — no fill, a plain `border/cell-quiet` outline. 3.5:1.
//
// Open now is the cell's *own* outline going `accent` at `border/emphasis`, not a ring laid over
// it: the base cell already carries a 1pt border, and a React Native border is drawn inside the
// box, so going to 2pt changes nothing about the cell's size or the row's layout. The white ring
// this replaced was an absolutely-positioned overlay.
//
// Every label here is near-white (Artem's review): the muted and faint greys this grid used sat at
// 3.5–5.5:1, under the 4.5:1 WCAG asks of text this small, and on a phone they disappeared. The
// struck-through `Skip` is the one exception — it is a cell's content, and reading as quieter than
// a trained day is the point.

import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';

import { BORDER_WIDTHS, COLORS, OPACITY, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';

import type { MesoGridCellLook } from './MesoGridLogic';

export const styles = StyleSheet.create({
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
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
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
    // Every look carries a border of the same width, so a cell that draws none is transparent
    // rather than borderless — otherwise the row would jump as looks differ.
    borderWidth: BORDER_WIDTHS['border/default'],
    borderColor: 'transparent',
  },
  /** A day that was trained. */
  cellDone: {
    backgroundColor: COLORS['accent/bg'],
    borderColor: COLORS['accent/border'],
  },
  /** Everything still to do, whether it's programmed yet or not. */
  cellLeft: {
    borderColor: COLORS['border/cell-quiet'],
  },
  /** The day the caller has open — over any look, and without touching the cell's size. */
  cellOpen: {
    borderWidth: BORDER_WIDTHS['border/emphasis'],
    borderColor: COLORS.accent,
  },
  /** A day of a stopped block that was never trained: nothing to open (08.9). */
  cellInert: {
    opacity: OPACITY['opacity/dimmed'],
  },
  cellPressed: {
    opacity: OPACITY['opacity/pressed'],
  },
  skipLabel: {
    fontSize: TYPOGRAPHY['type/meta'].fontSize,
    color: COLORS['text/muted'],
    textDecorationLine: 'line-through',
  },
});

/** The look of a cell's frame — `cellOpen` goes on top of whichever applies. `skip` draws none. */
export const CELL_LOOK_STYLES: Record<MesoGridCellLook, ViewStyle | undefined> = {
  done: styles.cellDone,
  skip: undefined,
  left: styles.cellLeft,
};

export const SKIP_LABEL_STYLE: TextStyle = styles.skipLabel;
