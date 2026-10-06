import { dimWithHolePath, ringRadius, ringRect } from '@design/coachmarkLayout';

describe('ringRect', () => {
  test('grows the element’s rect by the gap on every side', () => {
    expect(ringRect({ x: 100, y: 200, width: 40, height: 20 }, 4)).toEqual({
      x: 96,
      y: 196,
      width: 48,
      height: 28,
    });
  });
});

describe('ringRadius', () => {
  const small = { x: 0, y: 0, width: 24, height: 24 };

  test('keeps the radius it is given when the rect is big enough for it', () => {
    expect(ringRadius({ x: 0, y: 0, width: 100, height: 50 }, 12)).toBe(12);
  });

  test('never more than half the shorter side, so a small round button gets a round ring', () => {
    expect(ringRadius(small, 999)).toBe(12);
    expect(ringRadius({ x: 0, y: 0, width: 80, height: 20 }, 999)).toBe(10);
  });
});

describe('dimWithHolePath', () => {
  const window = { width: 400, height: 800 };

  test('is the whole window with the rect’s rounded outline as a second subpath', () => {
    const path = dimWithHolePath(window, { x: 100, y: 200, width: 50, height: 40 }, 10);

    expect(path.startsWith('M0 0H400V800H0Z')).toBe(true);
    // Starts the hole after its top-left corner, then walks its four sides and four corners.
    expect(path).toContain('M110 200 H140 A10 10 0 0 1 150 210 V230 A10 10 0 0 1 140 240');
    expect(path.endsWith('Z')).toBe(true);
  });

  test('a rect that is all corner becomes a circle', () => {
    const path = dimWithHolePath(window, { x: 10, y: 10, width: 24, height: 24 }, 999);

    expect(path).toContain('A12 12 0 0 1');
    expect(path).not.toContain('A999');
  });
});
