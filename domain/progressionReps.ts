// Progression engine, rule 2 — per-set target reps. See 03 · Progression Engine, "Правило 2 —
// повторы". Pure functions: set N of the next week is computed from set N of the source
// session, each set on its own.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { SessionExercise, SetLog, SetTarget } from '@domain/execution';
import type { ProgressionSettings } from '@domain/mesocycle';
import { bandAtCeiling, hintForReps } from '@domain/progressionWeightHint';

type RepCorridor = Pick<ProgressionSettings, 'minReps' | 'maxReps'>;

/**
 * A sum that came out at 0 or below is no recommendation at all (the row keeps `N RIR`: "не
 * уверен — не рекомендуй"). One rep is a target, with its hint.
 *
 * The corridor plays no part in the sum (GT-163, Artem 17.10.2026): it is the trigger for rule 3's
 * weight hint, not a limit on the target. A fact of 35 is a target of 36 with "take more", not 30;
 * a fact of 4 is 5 with "take less", not the corridor's floor. Strength and power alike.
 */
export function usableReps(reps: number): number | undefined {
  return reps >= 1 ? reps : undefined;
}

/** `loggedReps + 1` — rule 2, unclamped. */
export function nextTargetReps(loggedReps: number): number | undefined {
  return usableReps(loggedReps + 1);
}

/**
 * `referenceReps + 1 − (startRir − referenceTargetRir)`, unclamped (`usableReps`) — rule 2's
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
): number | undefined {
  return usableReps(referenceReps + 1 - (startRir - referenceTargetRir));
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
 * would only restate it and a hint would point at a weight there's no way to change. A
 * resistance band is the one bodyweight exercise that keeps a hint, at the top of the corridor.
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
  const hint = hintForReps(log.reps, settings, equipment);
  const target: SetTarget = { setNumber: source.setNumber };
  const reps = nextTargetReps(log.reps);
  if (reps !== undefined && !bandAtCeiling(hint, equipment)) {
    target.targetReps = reps;
  }
  if (carriesWeight) {
    target.suggestedWeight = log.weight;
  }
  if (hint !== undefined) {
    target.weightHint = hint;
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
