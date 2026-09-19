import { capsule, circle, roundedBar, square, tapTargetSlop } from '@design/shapes';
import { SIZES } from '@design/tokens';

describe('shapes', () => {
  test('circle: equal sides, radius half the diameter', () => {
    expect(circle(8)).toEqual({ width: 8, height: 8, borderRadius: 4 });
  });

  test('square: equal sides, no radius', () => {
    expect(square(14)).toEqual({ width: 14, height: 14 });
  });

  test('roundedBar: height with radius half of it', () => {
    expect(roundedBar(3)).toEqual({ height: 3, borderRadius: 1.5 });
  });

  test('capsule: fixed width and a rounded bar', () => {
    expect(capsule(36, 4)).toEqual({ width: 36, height: 4, borderRadius: 2 });
  });

  test('tapTargetSlop grows a control to the 44pt tap target, and never shrinks one', () => {
    expect(SIZES['size/tap-target']).toBe(44);
    expect(tapTargetSlop(36)).toBe(4);
    expect(tapTargetSlop(20)).toBe(12);
    expect(tapTargetSlop(44)).toBe(0);
    expect(tapTargetSlop(48)).toBe(0);
  });
});
