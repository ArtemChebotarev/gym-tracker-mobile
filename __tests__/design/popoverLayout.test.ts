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
});
