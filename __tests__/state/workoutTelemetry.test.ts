import type { TelemetryClient } from '@domain/telemetry';
import type { Session } from '@domain/execution';
import { logger } from '@state/logger';
import { setTelemetryClient } from '@state/telemetry';
import { trackWorkoutCompleted } from '@state/workoutTelemetry';
import { sessionWorkoutKind, type WorkoutKindDeps } from '@usecases/workoutKind';
import { STAMPS } from '../fixtures/stamps';

// What the day was is the use case's (tested on its own); here only when it is asked and sent.
jest.mock('@usecases/workoutKind', () => ({ sessionWorkoutKind: jest.fn() }));

const kindOf = sessionWorkoutKind as jest.Mock;
const DEPS = {} as WorkoutKindDeps;

function closed(status: Session['status']): Session {
  return {
    ...STAMPS,
    id: 'session',
    mesoId: 'meso',
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status,
  };
}

function installClient(): jest.Mock {
  const client: TelemetryClient & { capture: jest.Mock } = { capture: jest.fn() };
  setTelemetryClient(client);
  return client.capture;
}

afterEach(() => {
  setTelemetryClient(undefined);
  jest.restoreAllMocks();
  kindOf.mockReset();
});

describe('trackWorkoutCompleted', () => {
  test('a completed day is sent with its kind', async () => {
    const capture = installClient();
    kindOf.mockResolvedValue('hybrid');

    await trackWorkoutCompleted(closed('completed'), DEPS);

    expect(kindOf).toHaveBeenCalledWith('session', DEPS);
    expect(capture).toHaveBeenCalledWith('workout_completed', { type: 'hybrid' });
  });

  test('a day closed with nothing logged is not a completed workout', async () => {
    const capture = installClient();

    await trackWorkoutCompleted(closed('skipped'), DEPS);

    expect(kindOf).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  test('with telemetry off the day is not even read', async () => {
    await trackWorkoutCompleted(closed('completed'), DEPS);

    expect(kindOf).not.toHaveBeenCalled();
  });

  test('a failed read is logged and nothing is sent', async () => {
    const capture = installClient();
    const failure = new Error('database closed');
    kindOf.mockRejectedValue(failure);
    const logged = jest.spyOn(logger, 'error').mockImplementation(() => undefined);

    await expect(trackWorkoutCompleted(closed('completed'), DEPS)).resolves.toBeUndefined();

    expect(capture).not.toHaveBeenCalled();
    expect(logged).toHaveBeenCalledWith('telemetry.workoutCompleted', failure, {
      sessionId: 'session',
    });
  });
});
