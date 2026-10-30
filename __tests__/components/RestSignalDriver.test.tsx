import { act, waitFor } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import { RestSignalDriver } from '@components/RestSignalDriver';
import type { RestSignal } from '@state/restSignal';
import { dismissRestSignal, setRestSignal } from '@state/restSignal';
import { useIntervalTimerStore } from '@state/intervalTimerStore';
import { useRestTimerStore } from '@state/restTimerStore';
import { setSignals } from '@usecases/timerSettings';

import {
  queryClient,
  renderWithRepositories,
  withRepositories,
} from '../fixtures/renderWithRepositories';

jest.mock('@state/restSignal', () => ({
  dismissRestSignal: jest.fn(),
  onRestSignalReceived: jest.fn(() => jest.fn()),
  setRestSignal: jest.fn(() => Promise.resolve()),
}));

const repositories = withRepositories();

const NOW = 1_000_000;
const REST = {
  sessionExerciseId: 'se',
  next: { kind: 'set' as const, name: 'Press', setNumber: 2 },
  durationSec: 60,
};

const rest = () => useRestTimerStore.getState();
const signal = jest.mocked(setRestSignal);

/** What the signal was last set to; `undefined` when it has not been touched since `clearSignal`. */
const lastSignal = (): RestSignal | null | undefined => signal.mock.lastCall?.[0];

/** Forgets the calls so far, so a test sees only what its step sets off. */
const clearSignal = () => signal.mockClear();

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  act(() => {
    useIntervalTimerStore.getState().close();
    useIntervalTimerStore.getState().clearFinished();
    rest().clear();
  });
  jest.useRealTimers();
});

describe('RestSignalDriver', () => {
  test('schedules the signal for the end of a rest, saying what is next', () => {
    renderWithRepositories(<RestSignalDriver />);

    act(() => rest().start(REST));

    expect(lastSignal()).toEqual({
      endsAt: NOW + 60_000,
      title: 'Rest is over',
      body: 'Press · Set 2 next',
      signals: { sound: true, vibration: true },
    });
  });

  test('schedules once for a rest, however the time goes on', () => {
    renderWithRepositories(<RestSignalDriver />);
    act(() => rest().start(REST));
    clearSignal();

    act(() => jest.advanceTimersByTime(30_000));

    expect(signal).not.toHaveBeenCalled();
  });

  test('a new Log moves the signal to the new rest', () => {
    renderWithRepositories(<RestSignalDriver />);
    act(() => rest().start(REST));

    act(() => jest.advanceTimersByTime(10_000));
    act(() => rest().start(REST));

    expect(lastSignal()).toMatchObject({ endsAt: NOW + 70_000 });
  });

  test('Pause calls the signal off, and Resume sets it for the new end', () => {
    renderWithRepositories(<RestSignalDriver />);
    act(() => rest().start(REST));
    act(() => jest.advanceTimersByTime(10_000));

    act(() => rest().pause());
    expect(lastSignal()).toBeNull();

    act(() => jest.advanceTimersByTime(20_000));
    act(() => rest().resume());
    expect(lastSignal()).toMatchObject({ endsAt: NOW + 30_000 + 50_000 });
  });

  test.each([
    ['Skip', () => rest().skip()],
    ['the workout having nothing left', () => rest().stop()],
    ['the workout ending', () => rest().clear()],
    [
      'the interval timer taking over',
      () =>
        useIntervalTimerStore.getState().start({
          exercise: {
            sessionId: 'session',
            sessionExerciseId: 'bag',
            name: 'Heavy bag',
            totalRounds: 1,
            loggedRoundNumbers: [],
          },
          rounds: [{ roundNumber: 1, workSec: 60, restSec: 30 }],
          getReadySec: 5,
        }),
    ],
  ])('%s calls the signal off', (_name, end) => {
    renderWithRepositories(<RestSignalDriver />);
    act(() => rest().start(REST));

    act(end);

    expect(lastSignal()).toBeNull();
  });

  test('leaves the signal of a rest that ran out: the system may still be delivering it', () => {
    renderWithRepositories(<RestSignalDriver />);
    act(() => rest().start(REST));
    clearSignal();

    act(() => rest().finish());

    expect(signal).not.toHaveBeenCalled();
  });

  test('changing the settings during a rest schedules the signal again', async () => {
    jest.useRealTimers();
    renderWithRepositories(<RestSignalDriver />);
    act(() => rest().start(REST));

    await act(async () => {
      await setSignals(
        { sound: false, vibration: true },
        { settingsRepo: repositories().settingsRepo },
      );
      await queryClient().invalidateQueries({ queryKey: ['timerSettings'] });
    });

    await waitFor(() =>
      expect(lastSignal()).toMatchObject({ signals: { sound: false, vibration: true } }),
    );
  });

  test('takes a delivered signal away at launch and when the app comes back', () => {
    const listeners: ((state: AppStateStatus) => void)[] = [];
    const addListener = jest.spyOn(AppState, 'addEventListener').mockImplementation((_, fn) => {
      listeners.push(fn);
      return { remove: jest.fn() };
    });

    renderWithRepositories(<RestSignalDriver />);
    expect(dismissRestSignal).toHaveBeenCalledTimes(1);

    listeners.forEach((listener) => listener('background'));
    expect(dismissRestSignal).toHaveBeenCalledTimes(1);

    listeners.forEach((listener) => listener('active'));
    expect(dismissRestSignal).toHaveBeenCalledTimes(2);

    addListener.mockRestore();
  });
});
