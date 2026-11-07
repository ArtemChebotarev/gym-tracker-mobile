import type { TelemetryClient } from '@domain/telemetry';
import { logger } from '@state/logger';
import { setTelemetryClient, track } from '@state/telemetry';

function fakeClient(): TelemetryClient & { capture: jest.Mock } {
  return { capture: jest.fn() };
}

afterEach(() => {
  setTelemetryClient(undefined);
  jest.restoreAllMocks();
});

describe('track', () => {
  test('sends nothing while no client is installed', () => {
    const client = fakeClient();

    track('app_opened');
    setTelemetryClient(client);

    expect(client.capture).not.toHaveBeenCalled();
  });

  test('hands the event to the installed client', () => {
    const client = fakeClient();
    setTelemetryClient(client);

    track('app_opened');

    expect(client.capture).toHaveBeenCalledWith('app_opened', undefined);
  });

  test('a client that throws is logged, not passed on to the caller', () => {
    const failure = new Error('network');
    setTelemetryClient({
      capture: () => {
        throw failure;
      },
    });
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    expect(() => track('app_opened')).not.toThrow();
    expect(logged).toHaveBeenCalledWith('telemetry.capture', failure, { event: 'app_opened' });
  });
});
