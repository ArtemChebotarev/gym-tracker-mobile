// `workout_completed` (GT-247), sent after Finish workout and Skip workout. Both close the day the
// same way (usecases/sessionFinish.ts, `closeSession`): `completed` when something was logged,
// `skipped` when nothing was — and only a `completed` day is a workout that happened.
//
// The event's `type` needs a read of the day's exercises, so it runs only when telemetry is on,
// after the mutation has succeeded, and a failure is logged, never shown: the workout is saved
// either way.

import type { Session } from '@domain/execution';
import { sessionWorkoutKind, type WorkoutKindDeps } from '@usecases/workoutKind';

import { logger } from './logger';
import { isTelemetryEnabled, track } from './telemetry';

export async function trackWorkoutCompleted(
  session: Session,
  deps: WorkoutKindDeps,
): Promise<void> {
  if (session.status !== 'completed' || !isTelemetryEnabled()) return;
  try {
    track('workout_completed', { type: await sessionWorkoutKind(session.id, deps) });
  } catch (error) {
    logger.error('telemetry.workoutCompleted', error, { sessionId: session.id });
  }
}
