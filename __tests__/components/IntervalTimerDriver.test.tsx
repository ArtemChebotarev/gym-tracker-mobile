import { act, waitFor } from '@testing-library/react-native';
import { Vibration } from 'react-native';

import { IntervalTimerDriver } from '@components/IntervalTimerDriver';
import type { Signals } from '@domain/signals';
import { scheduleCountdown } from '@state/intervalSignal';
import { useIntervalTimerStore } from '@state/intervalTimerStore';
import { useTimerCapsuleStore } from '@state/timerCapsuleStore';
import { setSignals } from '@usecases/timerSettings';

import {
  queryClient,
  renderWithRepositories,
  withRepositories,
} from '../fixtures/renderWithRepositories';

// The driver's signals follow Settings (GT-172). The countdown's own timing and players are
// state/intervalSignal's, tested beside it; here it only matters what the driver asks of it.
jest.mock('@state/intervalSignal', () => ({
  scheduleCountdown: jest.fn(),
  cancelCountdown: jest.fn(),
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));

const repositories = withRepositories();

const EXERCISE = {
  sessionId: 'session',
  sessionExerciseId: 'bag',
  name: 'Heavy bag',
  totalRounds: 1,
  loggedRoundNumbers: [],
};
const ROUNDS = [{ roundNumber: 1, workSec: 60, restSec: 30 }];

let vibrate: jest.SpyInstance;

beforeEach(() => {
  vibrate = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);
});

afterEach(() => {
  act(() => {
    useIntervalTimerStore.getState().close();
    useIntervalTimerStore.getState().clearFinished();
    useTimerCapsuleStore.getState().clear();
  });
  vibrate.mockRestore();
  jest.mocked(scheduleCountdown).mockClear();
  jest.useRealTimers();
});

/**
 * Saves the signals, renders the driver once it has read them, then starts the timer on a fake
 * clock. Storage and the query answer on the real one, so the fake clock comes in only after.
 */
async function startWithSignals(signals: Signals) {
  await setSignals(signals, { settingsRepo: repositories().settingsRepo });
  renderWithRepositories(<IntervalTimerDriver />);
  await waitFor(() =>
    expect(queryClient().getQueryData(['timerSettings'])).toMatchObject({ signals }),
  );
  jest.useFakeTimers({ now: 1_000_000 });
  act(() =>
    useIntervalTimerStore.getState().start({ exercise: EXERCISE, rounds: ROUNDS, getReadySec: 5 }),
  );
}

/** Whether the countdown the driver set for the running phase would sound now. */
function countdownSounds(): boolean {
  const soundOn = jest.mocked(scheduleCountdown).mock.calls.at(-1)?.[1];
  if (soundOn === undefined) throw new Error('no countdown set');
  return soundOn();
}

describe('IntervalTimerDriver', () => {
  test('with both signals on: a buzz as work starts, and a countdown that sounds', async () => {
    await startWithSignals({ sound: true, vibration: true });
    expect(countdownSounds()).toBe(true);

    act(() => jest.advanceTimersByTime(5_000));

    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  test('with the vibration off the phases change without a buzz', async () => {
    await startWithSignals({ sound: true, vibration: false });

    act(() => jest.advanceTimersByTime(5_000));

    expect(vibrate).not.toHaveBeenCalled();
    expect(countdownSounds()).toBe(true);
  });

  test('with the sound off the countdown stays silent, and the buzz still comes', async () => {
    await startWithSignals({ sound: false, vibration: true });
    expect(countdownSounds()).toBe(false);

    act(() => jest.advanceTimersByTime(5_000));

    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(countdownSounds()).toBe(false);
  });
});
