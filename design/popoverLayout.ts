// Where a Popover's plate and its arrow land, given the anchor it points at — see 08.0 · Design
// SDK, "Компоненты" (`Popover`) and 08.7.1.
//
// A plain helper next to `shapes.ts` rather than part of the component: the placement is pure
// arithmetic worth testing without rendering, and the halves and offsets it takes on tokens
// belong outside `design/components/**`, where no number may appear (task 100).

/** An anchor as `measureInWindow` reports it. */
export type AnchorRect = { x: number; y: number; width: number; height: number };

export type WindowSize = { width: number; height: number };

/**
 * The plate spans the window minus `margin` on both sides, and sits under the anchor — or over it,
 * once the anchor is past the middle of the window and a plate below it would run off the bottom.
 * Given the safe area and the plate's height (`PlateRoom`), that side is only kept while the plate
 * fits there: otherwise it takes the other side, and with no room on either it is pinned inside the
 * safe area, over the anchor.
 *
 * Which edge is pinned is why this is a union: `below` grows downward from `top`, `above` upward
 * from `bottom`, so the first frame — before the plate's height is known — needs neither.
 *
 * `arrowLeft` is the arrow's offset inside the plate: centered on the anchor, and never closer to
 * a corner than `margin`, where the plate's rounded edge would cut it.
 */
export type PopoverLayout = {
  left: number;
  right: number;
  /** The arrow's offset from the plate's left edge. */
  arrowLeft: number;
  /**
   * `false` once the plate fits on neither side and is pinned to the edge of the safe area instead,
   * over the anchor: an arrow there would point at nothing.
   */
  showsArrow: boolean;
} & ({ placement: 'below'; top: number } | { placement: 'above'; bottom: number });

/**
 * What the plate has to fit in: the window's safe area — `insets` off its top and bottom, the
 * status bar and Dynamic Island above, the home indicator below — and its own height, once it has
 * been laid out.
 */
export type PlateRoom = {
  insets: { top: number; bottom: number };
  plateHeight: number;
};

/**
 * How far the arrow is pushed past the plate's edge — half of it, so the other half overlaps the
 * plate and the two read as one shape. Negative: `top` for an arrow pointing up, `bottom` for one
 * pointing down.
 */
export function arrowOffset(arrowSize: number): number {
  return -arrowSize / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function popoverLayout(
  anchor: AnchorRect,
  window: WindowSize,
  margin: number,
  arrowSize: number,
  /**
   * How far the plate's edge is from the anchor's. Defaults to the arrow's overlap, which puts the
   * arrow's tip on the anchor — right for a Popover, whose anchor is the thing it explains. A
   * coachmark's anchor has a ring round it, and wants the arrow to stop short of that.
   */
  distance: number = arrowSize / 2,
  /**
   * The safe area and the plate's height. Without it — before the plate has been laid out — the
   * side is picked by the anchor's place alone.
   */
  room?: PlateRoom,
): PopoverLayout {
  const overlap = arrowSize / 2;
  const plateWidth = window.width - margin * 2;
  const arrowLeft = clamp(
    anchor.x + anchor.width / 2 - margin - overlap,
    margin,
    // A plate narrower than its own margins leaves nowhere to put the arrow; keep it non-negative
    // rather than letting the clamp invert.
    Math.max(plateWidth - margin - arrowSize, margin),
  );
  const base = { left: margin, right: margin, arrowLeft, showsArrow: true };
  const top = anchor.y + anchor.height + distance;
  const bottom = window.height - anchor.y + distance;
  const below = { ...base, placement: 'below' as const, top };
  const above = { ...base, placement: 'above' as const, bottom };
  const preferred = anchor.y + anchor.height < window.height / 2 ? below : above;
  if (room === undefined) {
    return preferred;
  }

  // The plate keeps `margin` off the safe area's edges, as it does off the window's sides.
  const safeTop = room.insets.top + margin;
  const safeBottom = window.height - room.insets.bottom - margin;
  const fitsBelow = top + room.plateHeight <= safeBottom;
  const fitsAbove = window.height - bottom - room.plateHeight >= safeTop;
  const other = preferred === below ? above : below;
  if (preferred === below ? fitsBelow : fitsAbove) {
    return preferred;
  }
  if (other === below ? fitsBelow : fitsAbove) {
    return other;
  }

  // Neither side has room — a tall anchor, a card that fills most of the screen. The plate goes to
  // the roomier side and is pushed back inside the safe area, over the anchor.
  const roomBelow = safeBottom - top;
  const roomAbove = window.height - bottom - safeTop;
  return roomBelow >= roomAbove
    ? {
        ...below,
        showsArrow: false,
        top: Math.max(Math.min(top, safeBottom - room.plateHeight), safeTop),
      }
    : {
        ...above,
        showsArrow: false,
        bottom: Math.max(
          Math.min(bottom, window.height - safeTop - room.plateHeight),
          window.height - safeBottom,
        ),
      };
}
