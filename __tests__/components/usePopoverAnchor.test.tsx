import { act, renderHook } from '@testing-library/react-native';
import type { View } from 'react-native';

import { usePopoverAnchor } from '@components/usePopoverAnchor';

// `measureInWindow` answers nothing under Jest, so the button the hook measures is a stand-in that
// answers with a position, the way the device does.
function standIn(x: number, y: number): View {
  return {
    measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) =>
      callback(x, y, 24, 24),
  } as unknown as View;
}

describe('usePopoverAnchor', () => {
  test('opening measures the button and shows the plate', () => {
    const { result } = renderHook(() => usePopoverAnchor());
    result.current.ref.current = standIn(100, 200);

    act(() => result.current.open());

    expect(result.current.visible).toBe(true);
    expect(result.current.anchor).toEqual({ x: 100, y: 200, width: 24, height: 24 });
  });

  // The bug: closing cleared the anchor, and the plate — still on screen for its fade-out — was
  // redrawn without one, centred, so it jumped before it disappeared.
  test('closing hides the plate but keeps the anchor for its fade-out', () => {
    const { result } = renderHook(() => usePopoverAnchor());
    result.current.ref.current = standIn(100, 200);
    act(() => result.current.open());

    act(() => result.current.close());

    expect(result.current.visible).toBe(false);
    expect(result.current.anchor).toEqual({ x: 100, y: 200, width: 24, height: 24 });
  });

  test('opening again measures afresh — the button may have scrolled since', () => {
    const { result } = renderHook(() => usePopoverAnchor());
    result.current.ref.current = standIn(100, 200);
    act(() => result.current.open());
    act(() => result.current.close());

    result.current.ref.current = standIn(100, 340);
    act(() => result.current.open());

    expect(result.current.anchor).toEqual({ x: 100, y: 340, width: 24, height: 24 });
  });

  test('a platform that cannot measure still opens the plate, without an anchor', () => {
    const { result } = renderHook(() => usePopoverAnchor());

    act(() => result.current.open());

    expect(result.current.visible).toBe(true);
    expect(result.current.anchor).toBeNull();
  });
});
