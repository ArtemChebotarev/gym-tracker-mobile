import { act, waitFor } from '@testing-library/react-native';
import { createAudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';

import { RestTimerDriver } from '@components/RestTimerDriver';
import type { Signals } from '@domain/signals';
import { useRestTimerStore } from '@state/restTimerStore';
import { useTimerCapsuleStore } from '@state/timerCapsuleStore';
import { setSignals } from '@usecases/timerSettings';

import {
  queryClient,
  renderWithRepositories,
  withRepositories,
} from '../fixtures/renderWithRepositories';

const repositories = withRepositories();

const REST = {
  sessionExerciseId: 'se',
  next: { kind: 'set' as const, setNumber: 2 },
  durationSec: 60,
};

/** The rest-over player, made the first time a rest runs out with its sound on. */
function restOverPlayer(): { play: jest.Mock } | undefined {
  return jest.mocked(createAudioPlayer).mock.results.at(-1)?.value as
    | { play: jest.Mock }
    | undefined;
}

/**
 * How many times the rest-over sound has played. The player is made once and kept for the whole
 * file, as in the app, so a test compares the count before and after.
 */
function timesPlayed(): number {
  return restOverPlayer()?.play.mock.calls.length ?? 0;
}

/**
 * Saves the signals, then renders the driver once it has read them. Storage and the query answer
 * on the real clock, so the fake one is put back only once the settings are in.
 */
async function renderWithSignals(signals: Signals) {
  jest.useRealTimers();
  await setSignals(signals, { settingsRepo: repositories().settingsRepo });
  renderWithRepositories(<RestTimerDriver />);
  await waitFor(() =>
    expect(queryClient().getQueryData(['timerSettings'])).toMatchObject({ signals }),
  );
  jest.useFakeTimers({ now: 1_000_000 });
}

/** Runs a rest out, letting the sound's seek back to the start land. */
async function runRestOut() {
  act(() => useRestTimerStore.getState().start(REST));
  await act(async () => {
    jest.advanceTimersByTime(60_000);
  });
}

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
    renderWithRepositories(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));
    expect(capsule()).toMatchObject({ state: 'running', title: '1:00' });

    act(() => jest.advanceTimersByTime(15_000));
    expect(capsule()).toMatchObject({ title: '0:45', caption: 'Rest · set 2 next' });
  });

  test('when the time is up: one signal, and the capsule says the rest is over', async () => {
    renderWithRepositories(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));

    // The sound plays once its seek back to the start has landed — a promise later.
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });

    expect(capsule()).toMatchObject({ state: 'finished', title: 'Rest is over' });
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(restOverPlayer()?.play).toHaveBeenCalledTimes(1);

    act(() => jest.advanceTimersByTime(60_000));
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  test('with the sound off the rest ends in a vibration only', async () => {
    await renderWithSignals({ sound: false, vibration: true });
    const played = timesPlayed();

    await runRestOut();

    expect(capsule()).toMatchObject({ state: 'finished' });
    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(timesPlayed()).toBe(played);
  });

  test('with the vibration off the rest ends in the sound only', async () => {
    await renderWithSignals({ sound: true, vibration: false });
    const played = timesPlayed();

    await runRestOut();

    expect(capsule()).toMatchObject({ state: 'finished' });
    expect(vibrate).not.toHaveBeenCalled();
    expect(timesPlayed()).toBe(played + 1);
  });

  test('a paused rest does not run out', () => {
    renderWithRepositories(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));
    act(() => jest.advanceTimersByTime(10_000));
    act(() => capsule()?.onPause?.());

    act(() => jest.advanceTimersByTime(300_000));

    expect(capsule()).toMatchObject({ state: 'paused', title: '0:50' });
    expect(vibrate).not.toHaveBeenCalled();
  });

  test('Skip takes the capsule down without a signal', () => {
    renderWithRepositories(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));

    act(() => capsule()?.onSkip?.());
    act(() => jest.advanceTimersByTime(120_000));

    expect(capsule()).toBeNull();
    expect(vibrate).not.toHaveBeenCalled();
  });

  test('a rest that ran on while the app was away shows the right time when it is looked at', () => {
    renderWithRepositories(<RestTimerDriver />);
    act(() => useRestTimerStore.getState().start(REST));

    // No ticks in between: the clock jumps, as it does when the app comes back from the background.
    // The driver looks again as its next second was due — at the latest a second on.
    act(() => jest.setSystemTime(Date.now() + 42_000));
    act(() => jest.advanceTimersByTime(1_000));

    // 42 s away and the second it waited: 43 s of the minute gone.
    expect(capsule()).toMatchObject({ title: '0:17' });
  });
});
