import { popoverLayout } from '@design/popoverLayout';

const window = { width: 390, height: 844 };
const MARGIN = 16;
const ARROW = 12;

function layoutFor(anchor: { x: number; y: number }) {
  return popoverLayout({ ...anchor, width: 24, height: 24 }, window, MARGIN, ARROW);
}

describe('popoverLayout', () => {
  test('the plate spans the window minus a margin on both sides', () => {
    const layout = layoutFor({ x: 180, y: 200 });

    expect(layout.left).toBe(MARGIN);
    expect(layout.right).toBe(MARGIN);
  });

  test('an anchor in the top half is pointed at from below', () => {
    const layout = layoutFor({ x: 180, y: 200 });

    expect(layout).toMatchObject({ placement: 'below', top: 200 + 24 + ARROW / 2 });
  });

  test('an anchor past the middle is pointed at from above, so the plate has room', () => {
    const layout = layoutFor({ x: 180, y: 700 });

    expect(layout).toMatchObject({ placement: 'above', bottom: 844 - 700 + ARROW / 2 });
  });

  test('the arrow sits under the middle of the anchor', () => {
    const layout = layoutFor({ x: 180, y: 200 });

    // The anchor's centre is at 192 in the window, 176 inside a plate that starts at 16.
    expect(layout.arrowLeft).toBe(192 - MARGIN - ARROW / 2);
  });

  test('the arrow keeps clear of the plate’s rounded corners', () => {
    expect(layoutFor({ x: 0, y: 200 }).arrowLeft).toBe(MARGIN);
    expect(layoutFor({ x: window.width - 24, y: 200 }).arrowLeft).toBe(
      window.width - MARGIN * 2 - MARGIN - ARROW,
    );
  });

  // A coachmark's anchor has a ring round it; the plate keeps its own distance from it, and the
  // arrow's size still decides where the arrow sits.
  test('a given distance replaces the arrow’s overlap, below and above', () => {
    const below = popoverLayout({ x: 180, y: 200, width: 24, height: 24 }, window, MARGIN, 14, 16);
    const above = popoverLayout({ x: 180, y: 700, width: 24, height: 24 }, window, MARGIN, 14, 16);

    expect(below).toMatchObject({ placement: 'below', top: 200 + 24 + 16 });
    expect(above).toMatchObject({ placement: 'above', bottom: 844 - 700 + 16 });
  });

  // GT-241: the edit coachmark rings a whole card. Its bottom past the middle sent the plate above
  // it, and a card that starts near the top pushed the plate under the status bar.
  describe('given the safe area and the plate’s height', () => {
    const INSETS = { top: 59, bottom: 34 };
    const DISTANCE = 16;

    function fit(anchor: { y: number; height: number }, plateHeight: number) {
      return popoverLayout({ x: 16, width: 358, ...anchor }, window, MARGIN, 14, DISTANCE, {
        insets: INSETS,
        plateHeight,
      });
    }

    test('the usual side is kept while the plate fits there', () => {
      expect(fit({ y: 600, height: 100 }, 200)).toMatchObject({
        placement: 'above',
        bottom: 844 - 600 + DISTANCE,
        showsArrow: true,
      });
    });

    test('a plate that would run under the status bar goes below the anchor instead', () => {
      // The card's bottom (520) is past the middle, but only 50pt of safe area are above it.
      expect(fit({ y: 140, height: 380 }, 200)).toMatchObject({
        placement: 'below',
        top: 140 + 380 + DISTANCE,
        showsArrow: true,
      });
    });

    test('with room on neither side the plate is pinned inside the safe area, without an arrow', () => {
      // 120..720: 29pt of safe area above the anchor and 58 below it, both short of a 200pt plate.
      // Below has more, so the plate goes there and is pushed up until its bottom clears the home
      // indicator.
      expect(fit({ y: 120, height: 600 }, 200)).toMatchObject({
        placement: 'below',
        top: 844 - INSETS.bottom - MARGIN - 200,
        showsArrow: false,
      });
    });

    test('without the plate’s height the side is picked by the anchor alone', () => {
      expect(
        popoverLayout({ x: 16, y: 140, width: 358, height: 380 }, window, MARGIN, 14, DISTANCE),
      ).toMatchObject({ placement: 'above', showsArrow: true });
    });
  });
});
