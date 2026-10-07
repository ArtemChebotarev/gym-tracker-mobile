import { act, renderHook } from '@testing-library/react-native';

import { useDelayedFlag } from '@components/useDelayedFlag';

describe('useDelayedFlag', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('turns on only after the delay, not at once', () => {
    const { result } = renderHook(() => useDelayedFlag(true, 1000));

    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(999));
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(true);
  });

  test('stays off while inactive, and starts counting when it turns active', () => {
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) => useDelayedFlag(active, 1000),
      { initialProps: { active: false } },
    );

    act(() => jest.advanceTimersByTime(5000));
    expect(result.current).toBe(false);

    rerender({ active: true });
    expect(result.current).toBe(false);
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(true);
  });

  test('goes off the moment it lets go, and waits again next time', () => {
    const { result, rerender } = renderHook(
      ({ active }: { active: boolean }) => useDelayedFlag(active, 1000),
      { initialProps: { active: true } },
    );
    act(() => jest.advanceTimersByTime(1000));
    expect(result.current).toBe(true);

    rerender({ active: false });
    expect(result.current).toBe(false);

    rerender({ active: true });
    expect(result.current).toBe(false);
  });
});
