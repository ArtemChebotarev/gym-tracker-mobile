import { act, renderHook } from '@testing-library/react-native';

import { HourglassIcon } from '@design/icons/HourglassIcon';
import { useTimerCapsuleStore, useTimerCapsuleVisible } from '@state/timerCapsuleStore';

const REST = {
  state: 'running' as const,
  icon: HourglassIcon,
  title: '1:46',
  caption: 'Rest · set 3 next',
  progress: 0.5,
};

afterEach(() => {
  act(() => useTimerCapsuleStore.getState().clear());
});

describe('timerCapsuleStore', () => {
  test('starts empty', () => {
    const { result } = renderHook(() => useTimerCapsuleVisible());

    expect(result.current).toBe(false);
  });

  test('show puts a capsule up, and a new one replaces it — one timer at a time', () => {
    const { result } = renderHook(() => useTimerCapsuleVisible());

    act(() => useTimerCapsuleStore.getState().show(REST, 'rest'));
    act(() => useTimerCapsuleStore.getState().show({ ...REST, title: '0:42' }, 'rest'));

    expect(result.current).toBe(true);
    expect(useTimerCapsuleStore.getState().capsule?.title).toBe('0:42');
  });

  test('clear takes it down', () => {
    act(() => useTimerCapsuleStore.getState().show(REST, 'rest'));
    act(() => useTimerCapsuleStore.getState().clear());

    expect(useTimerCapsuleStore.getState().capsule).toBeNull();
  });
});

describe('owners (GT-97)', () => {
  test('a timer takes down only its own capsule', () => {
    act(() =>
      useTimerCapsuleStore
        .getState()
        .show({ ...REST, caption: 'Work · Heavy bag · 2 of 3' }, 'interval'),
    );
    act(() => useTimerCapsuleStore.getState().release('rest'));
    expect(useTimerCapsuleStore.getState().capsule?.caption).toBe('Work · Heavy bag · 2 of 3');

    act(() => useTimerCapsuleStore.getState().release('interval'));
    expect(useTimerCapsuleStore.getState().capsule).toBeNull();
  });
});
