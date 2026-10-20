import { act, render } from '@testing-library/react-native';
import { createAudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';

import { RestTimerDriver } from '@components/RestTimerDriver';
import { useRestTimerStore } from '@state/restTimerStore';
import { useTimerCapsuleStore } from '@state/timerCapsuleStore';

const REST = {
  sessionExerciseId: 'se',
  next: { kind: 'set' as const, setNumber: 2 },
  durationSec: 60,
};

function capsule() {
  return useTimerCapsuleStore.getState().capsule;
}

let vibrate: jest.SpyInstance;

beforeEach(() => {
  jest.useFakeTimers({ now: 1_000_000 });
  vibrate = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);
});

afterEach(() => {
  act(() => {
    useRestTimerStore.getState().clear();
    useTimerCapsuleStore.getState().clear();
  });
  vibrate.mockRestore();
  jest.useRealTimers();
});

describe('RestTimerDriver', () => {
  test('shows a started rest in the capsule and counts it down', () => {
    render(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));
    expect(capsule()).toMatchObject({ state: 'running', title: '1:00' });

    act(() => jest.advanceTimersByTime(15_000));
    expect(capsule()).toMatchObject({ title: '0:45', caption: 'Rest · set 2 next' });
  });

  test('when the time is up: one signal, and the capsule says the rest is over', async () => {
    render(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));

    // The sound plays once its seek back to the start has landed — a promise later.
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });

    expect(capsule()).toMatchObject({ state: 'finished', title: 'Rest is over' });
    expect(vibrate).toHaveBeenCalledTimes(1);
    const player = jest.mocked(createAudioPlayer).mock.results.at(-1)?.value as {
      play: jest.Mock;
    };
    expect(player.play).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(60_000));
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  test('a paused rest does not run out', () => {
    render(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));
    act(() => jest.advanceTimersByTime(10_000));
    act(() => capsule()?.onPause?.());

    act(() => jest.advanceTimersByTime(300_000));

    expect(capsule()).toMatchObject({ state: 'paused', title: '0:50' });
    expect(vibrate).not.toHaveBeenCalled();
  });

  test('Skip takes the capsule down without a signal', () => {
    render(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));

    act(() => capsule()?.onSkip?.());
    act(() => jest.advanceTimersByTime(120_000));

    expect(capsule()).toBeNull();
    expect(vibrate).not.toHaveBeenCalled();
  });

  test('a rest that ran on while the app was away shows the right time when it is looked at', () => {
    render(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));

    // No ticks in between: the clock jumps, as it does when the app comes back from the background.
    // The driver looks again as its next second was due — at the latest a second on.
    act(() => jest.setSystemTime(Date.now() + 42_000));
    act(() => jest.advanceTimersByTime(1_000));

    // 42 s away and the second it waited: 43 s of the minute gone.
    expect(capsule()).toMatchObject({ title: '0:17' });
  });
});
