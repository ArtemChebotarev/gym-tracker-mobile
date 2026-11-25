// Anonymous product telemetry (GT-243): a handful of named events that say whether people train
// and come back, nothing more. The catalog below is the whole list of what may leave the phone —
// an event that is not named here cannot be sent, and the privacy policy and App Store privacy
// labels describe exactly this list (state/README.md, "Telemetry").
//
// What the logging port says about its entries holds here too and more strictly: an event carries
// kinds and counts, never an id from the database, a name, a weight or anything the user typed.
// There is no user id either — the analytics service knows the phone only by a random id of its
// own, which a reinstall replaces.

import type { MesocycleOrigin } from './mesocycle';
import type { WorkoutKind } from './workoutKind';

/** Properties of one event: flat, and only kinds, counts and flags. */
export type TelemetryProperties = Readonly<Record<string, string | number | boolean>>;

/** Every event the app may send, with its properties. `Record<string, never>` = none. */
export type TelemetryEvents = {
  /** The app came to the foreground — a cold start, or a return after 30+ minutes in the background. */
  app_opened: Record<string, never>;
  /** A cycle was saved, by the flow it was built in: `scratch`, `template` or `copyWeek`. */
  cycle_created: { source: MesocycleOrigin['type'] };
  /** A planned cycle was started (Start), by the flow it was built in — same values as `cycle_created`. */
  cycle_started: { source: MesocycleOrigin['type'] };
  /**
   * A started cycle was closed: `completed` through Finish mesocycle, `abandoned` through Stop.
   * `weeks` is the planned length of the cycle, deload week included.
   */
  cycle_completed: { outcome: 'completed' | 'abandoned'; weeks: number };
  /**
   * A day was finished with work logged in it — Finish workout, or Skip workout after a set.
   * `week_number` is the cycle week it belonged to (1-based), `is_deload` whether that was the deload week.
   */
  workout_completed: { type: WorkoutKind; week_number: number; is_deload: boolean };
};

export type TelemetryEventName = keyof TelemetryEvents;

/** An event without properties is tracked with its name alone. */
export type TelemetryArgs<E extends TelemetryEventName> =
  TelemetryEvents[E] extends Record<string, never> ? [] : [properties: TelemetryEvents[E]];

/**
 * Where events go — the analytics SDK behind an adapter, so it can be replaced without touching
 * a screen. A client queues and sends on its own; `capture` must return at once.
 */
export interface TelemetryClient {
  capture(event: TelemetryEventName, properties?: TelemetryProperties): void;
}
