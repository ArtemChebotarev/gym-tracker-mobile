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
 * Which edge is pinned is why this is a union: `below` grows downward from `top`, `above` upward
 * from `bottom`, and neither needs the plate's own height, which isn't known until it has been
 * laid out.
 *
 * `arrowLeft` is the arrow's offset inside the plate: centered on the anchor, and never closer to
 * a corner than `margin`, where the plate's rounded edge would cut it.
 */
export type PopoverLayout = {
  left: number;
  right: number;
  /** The arrow's offset from the plate's left edge. */
  arrowLeft: number;
} & ({ placement: 'below'; top: number } | { placement: 'above'; bottom: number });

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
  const base = { left: margin, right: margin, arrowLeft };
  return anchor.y + anchor.height < window.height / 2
    ? { ...base, placement: 'below', top: anchor.y + anchor.height + overlap }
    : { ...base, placement: 'above', bottom: window.height - anchor.y + overlap };
}
