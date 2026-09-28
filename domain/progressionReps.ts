// Progression engine, rule 2 — per-set target reps. See 03 · Progression Engine, "Правило 2 —
// повторы". Pure functions: set N of the next week is computed from set N of the source
// session, each set on its own.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { SessionExercise, SetLog, SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import { weightHintForReps } from '@domain/progressionWeightHint';

type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

/** `clamp(loggedReps + 1, minReps, maxReps)`. */
export function nextTargetReps(loggedReps: number, settings: RepCorridor): number {
  return Math.min(Math.max(loggedReps + 1, settings.minReps), settings.maxReps);
}

/**
 * `clamp(referenceReps + 1 − (startRir − referenceTargetRir), minReps, maxReps)` — rule 2's
 * increment on the reference, then re-priced for a higher target RIR. Flow C's start reps (04,
 * "Расчёт startReps"), and rule 6's estimate from another block (task 134.1): both carry a
 * performance over into a block that runs at another RIR.
 *
 * The `+ 1` is what carries progression *across* blocks (task 125). Without it, a block copied
 * from the one that just ended lands back where that block started: a 3-week block runs week 1
 * at RIR 1 for 10 reps and week 2 at RIR 0 for 11, and re-pricing 11 reps for a `startRir` of 1
 * gives 10 again — the same number, block after block, forever. The increment earns the reps
 * back; the RIR term is what still makes the first week easier than the last.
 *
 * A reference performed at a *higher* RIR than the new block's start
 * (`startRir < referenceTargetRir`) moves the reps up further rather than down, which is the
 * same formula read the other way round — nothing special-cases it.
 */
export function startTargetReps(
  referenceReps: number,
  referenceTargetRir: number,
  startRir: number,
  settings: RepCorridor,
): number {
  const reps = referenceReps + 1 - (startRir - referenceTargetRir);
  return Math.min(Math.max(reps, settings.minReps), settings.maxReps);
}

/**
 * Next week's target for one set row.
 *
 * - Logged: reps progress by rule 2, the logged weight becomes the next `suggestedWeight`, and
 *   the set gets its own weight hint by rule 3.
 * - Not logged (skipped): the row carries over its previous `targetReps` and `suggestedWeight`
 *   with no increment. There is no new fact to judge, so no weight hint is carried. An estimate
 *   (task 134.1) isn't carried at all — the row comes back with no numbers, `N RIR`.
 *
 * A pure `bodyweight` exercise takes the reps half of that and nothing else (task 105): its load
 * is the body weight, which the block already knows and the screen fills in, so a weight target
 * would only restate it and a hint would point at a weight there's no way to change.
 */
export function nextSetTarget(
  source: SetTarget,
  log: Pick<SetLog, 'reps' | 'weight'> | undefined,
  settings: RepCorridor,
  equipment?: Equipment,
): SetTarget {
  const carriesWeight = !isPureBodyWeight(equipment);
  if (log === undefined) {
    if (source.estimate !== undefined) {
      // An estimate isn't a target to carry (03, "Оценка"): with nothing logged, the row has
      // nothing of its own to go by next week either.
      return { setNumber: source.setNumber };
    }
    const target: SetTarget = { setNumber: source.setNumber, targetReps: source.targetReps };
    if (carriesWeight && source.suggestedWeight !== undefined) {
      target.suggestedWeight = source.suggestedWeight;
    }
    return target;
  }
  const target: SetTarget = {
    setNumber: source.setNumber,
    targetReps: nextTargetReps(log.reps, settings),
  };
  if (carriesWeight) {
    target.suggestedWeight = log.weight;
    const hint = weightHintForReps(log.reps, settings);
    if (hint !== undefined) {
      target.weightHint = hint;
    }
  }
  return target;
}

/**
 * Next week's set targets for one exercise: one row per source row (rule 1 — the row count is
 * copied, never grown), each paired with the source session's `SetLog` of the same
 * `setNumber`. Logs belonging to other session exercises are ignored.
 */
export function nextSetTargets(
  source: Pick<SessionExercise, 'id' | 'setTargets'>,
  logs: readonly SetLog[],
  settings: RepCorridor,
  equipment?: Equipment,
): SetTarget[] {
  const logsBySetNumber = new Map<number, SetLog>();
  for (const log of logs) {
    if (log.sessionExerciseId === source.id && !logsBySetNumber.has(log.setNumber)) {
      logsBySetNumber.set(log.setNumber, log);
    }
  }
  return source.setTargets.map((target) =>
    nextSetTarget(target, logsBySetNumber.get(target.setNumber), settings, equipment),
  );
}
