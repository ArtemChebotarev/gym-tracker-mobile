import { act, renderHook } from '@testing-library/react-native';

import { useSecretTaps } from '@components/useSecretTaps';

// The door in front of the developer screen (task 070). What matters is that it opens on the
// fifth tap of a run and that ordinary taps on a title never accumulate into one.

describe('useSecretTaps', () => {
  test('opens on the count-th tap of an uninterrupted run, and not before', () => {
    const onOpen = jest.fn();
    const { result } = renderHook(() => useSecretTaps(5, onOpen));

    for (let tap = 0; tap < 4; tap += 1) {
      act(() => result.current());
      expect(onOpen).not.toHaveBeenCalled();
    }
    act(() => result.current());

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  test('a pause resets the run, so stray taps never add up', () => {
    jest.useFakeTimers();
    try {
      const onOpen = jest.fn();
      const { result } = renderHook(() => useSecretTaps(5, onOpen));

      act(() => result.current());
      act(() => result.current());
      jest.advanceTimersByTime(2000);
      act(() => result.current());
      act(() => result.current());
      act(() => result.current());

      expect(onOpen).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  test('starts over after opening, so five more taps open it again', () => {
    const onOpen = jest.fn();
    const { result } = renderHook(() => useSecretTaps(2, onOpen));

    act(() => result.current());
    act(() => result.current());
    act(() => result.current());
    act(() => result.current());

    expect(onOpen).toHaveBeenCalledTimes(2);
  });
});
