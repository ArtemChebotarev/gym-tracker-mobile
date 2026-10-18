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

    act(() => useTimerCapsuleStore.getState().show(REST));
    act(() => useTimerCapsuleStore.getState().show({ ...REST, title: '0:42' }));

    expect(result.current).toBe(true);
    expect(useTimerCapsuleStore.getState().capsule?.title).toBe('0:42');
  });

  test('clear takes it down', () => {
    act(() => useTimerCapsuleStore.getState().show(REST));
    act(() => useTimerCapsuleStore.getState().clear());

    expect(useTimerCapsuleStore.getState().capsule).toBeNull();
  });
});
