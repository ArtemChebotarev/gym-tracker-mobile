// The geometry of a coachmark's dimmed screen — 08.11 · Onboarding, "3. Коучмарки". Pure
// arithmetic next to `popoverLayout.ts`, for the same reason: it is worth testing without
// rendering, and the offsets it takes belong outside `design/components/**`, where no number may
// appear (task 100).

import type { AnchorRect, WindowSize } from './popoverLayout';

/** The element's rect grown by `gap` on every side: where the ring is drawn, and the hole cut. */
export function ringRect(anchor: AnchorRect, gap: number): AnchorRect {
  return {
    x: anchor.x - gap,
    y: anchor.y - gap,
    width: anchor.width + gap * 2,
    height: anchor.height + gap * 2,
  };
}

/** A radius no bigger than half the shorter side, so a small round button gets a round ring. */
export function ringRadius(rect: AnchorRect, radius: number): number {
  return Math.min(radius, rect.width / 2, rect.height / 2);
}

/**
 * The dim as one filled shape with a hole in it: the whole window, and `rect` with rounded corners
 * cut out of it (`fillRule="evenodd"`). Drawn so that, rather than as four dimmed strips around a
 * hole, because the hole has to be round at its corners to match the ring.
 */
export function dimWithHolePath(window: WindowSize, rect: AnchorRect, radius: number): string {
  const r = ringRadius(rect, radius);
  const { x, y, width, height } = rect;
  const right = x + width;
  const bottom = y + height;
  return [
    `M0 0H${window.width}V${window.height}H0Z`,
    `M${x + r} ${y}`,
    `H${right - r}`,
    `A${r} ${r} 0 0 1 ${right} ${y + r}`,
    `V${bottom - r}`,
    `A${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${bottom - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join(' ');
}
