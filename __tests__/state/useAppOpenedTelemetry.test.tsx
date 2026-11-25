import { renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import type { TelemetryClient } from '@domain/telemetry';
import { setTelemetryClient } from '@state/telemetry';
import {
  APP_OPENED_BACKGROUND_THRESHOLD_MS,
  useAppOpenedTelemetry,
} from '@state/useAppOpenedTelemetry';

let listener: ((state: AppStateStatus) => void) | undefined;
const remove = jest.fn();

function startIn(state: AppStateStatus): jest.Mock {
  Object.defineProperty(AppState, 'currentState', { value: state, configurable: true });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, handler) => {
    listener = handler as (state: AppStateStatus) => void;
    return { remove };
  });
  const client: TelemetryClient & { capture: jest.Mock } = { capture: jest.fn() };
  setTelemetryClient(client);
  renderHook(() => useAppOpenedTelemetry());
  return client.capture;
}

beforeEach(() => {
  jest.useFakeTimers({ now: new Date('2026-11-25T10:00:00Z') });
});

afterEach(() => {
  jest.useRealTimers();
  setTelemetryClient(undefined);
  listener = undefined;
  jest.restoreAllMocks();
});

describe('useAppOpenedTelemetry', () => {
  test('a cold start on screen counts as an opening', () => {
    const capture = startIn('active');

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith('app_opened', undefined);
  });

  test('a return after the threshold in the background counts again', () => {
    const capture = startIn('active');

    listener?.('background');
    jest.advanceTimersByTime(APP_OPENED_BACKGROUND_THRESHOLD_MS);
    listener?.('active');

    expect(capture).toHaveBeenCalledTimes(2);
  });

  test('a return sooner than the threshold (screen lock between sets) is not an opening', () => {
    const capture = startIn('active');

    listener?.('background');
    jest.advanceTimersByTime(APP_OPENED_BACKGROUND_THRESHOLD_MS - 1);
    listener?.('active');

    expect(capture).toHaveBeenCalledTimes(1);
  });

  test('the clock runs from leaving the screen, not from the last event sent', () => {
    const capture = startIn('active');

    // Locked every 20 minutes: each trip is short, none reaches the threshold on its own.
    for (let i = 0; i < 3; i += 1) {
      listener?.('background');
      jest.advanceTimersByTime(20 * 60 * 1000);
      listener?.('active');
      jest.advanceTimersByTime(20 * 60 * 1000);
    }

    expect(capture).toHaveBeenCalledTimes(1);
  });

  test('inactive during the background stay does not restart the clock', () => {
    const capture = startIn('active');

    listener?.('background');
    jest.advanceTimersByTime(APP_OPENED_BACKGROUND_THRESHOLD_MS);
    listener?.('inactive');
    listener?.('active');

    expect(capture).toHaveBeenCalledTimes(2);
  });

  test('a pass through inactive (Notification Center) is not an opening', () => {
    const capture = startIn('active');

    listener?.('inactive');
    listener?.('active');

    expect(capture).toHaveBeenCalledTimes(1);
  });

  test('a start off screen counts once the app comes on screen', () => {
    const capture = startIn('background');
    expect(capture).not.toHaveBeenCalled();

    listener?.('active');

    expect(capture).toHaveBeenCalledTimes(1);
  });
});
