import { renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';

import type { TelemetryClient } from '@domain/telemetry';
import { setTelemetryClient } from '@state/telemetry';
import { useAppOpenedTelemetry } from '@state/useAppOpenedTelemetry';

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

afterEach(() => {
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

  test('a return from the background counts again', () => {
    const capture = startIn('active');

    listener?.('background');
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
