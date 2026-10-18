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

/** The offset that centres something of the given size on a point it is positioned at. */
export function centerOffset(size: number): number {
  return -size / 2;
}

/**
 * The `hitSlop` that grows a control of the given size to the minimum tap target
 * (`size/tap-target`, 44pt) — the same on every side, none for a control already that big.
 */
export function tapTargetSlop(size: number) {
  return Math.max(0, (SIZES['size/tap-target'] - size) / 2);
}

/**
 * A progress ring drawn as an SVG circle stroke inside a square of `diameter`: the circle's radius
 * keeps the whole stroke inside the box, and the circumference is what a dash array divides.
 */
export function ring(diameter: number, strokeWidth: number) {
  const radius = (diameter - strokeWidth) / 2;
  return { center: diameter / 2, radius, circumference: 2 * Math.PI * radius };
}
