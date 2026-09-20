// Shape helpers over design tokens — geometry derived from a token rather than a new value.

import { SIZES } from './tokens';

/** A circle of the given diameter: equal width and height, radius half of it. */
export function circle(diameter: number) {
  return { width: diameter, height: diameter, borderRadius: diameter / 2 };
}

/** A square of the given side. */
export function square(side: number) {
  return { width: side, height: side };
}

/** A bar of the given height with fully rounded ends (radius half its height). */
export function roundedBar(height: number) {
  return { height, borderRadius: height / 2 };
}

/** A fixed-size bar with fully rounded ends. */
export function capsule(width: number, height: number) {
  return { width, ...roundedBar(height) };
}

/**
 * The `hitSlop` that grows a control of the given size to the minimum tap target
 * (`size/tap-target`, 44pt) — the same on every side, none for a control already that big.
 */
export function tapTargetSlop(size: number) {
  return Math.max(0, (SIZES['size/tap-target'] - size) / 2);
}
