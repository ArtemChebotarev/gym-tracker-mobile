// Pure helpers behind components/WorkoutSetRow.tsx — see the code-style skill.

import { isPureBodyWeight, usesAddedWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { TargetIndicator } from '@domain/execution';
import { validateSetEntry } from '@domain/executionValidators';
import type { NotDoneStatus } from '@domain/sessionExerciseStatus';
import type { WeightSwapEvaluation } from '@domain/weightSwap';
import { evaluateWeightSwap } from '@domain/weightSwapRules';
import { formatRir } from '@design/formatRir';
import type { WorkoutSetRow } from '@usecases/workoutSession';

/**
 * The word for rows that were never done (08.7, "Строка подхода"): `Skipped` when the user skipped
 * the exercise, `Abandoned` when Stop mesocycle closed it (136) — the status's own name, so the
 * card never says `Skipped` about a day the user didn't pass on. Same look either way.
 */
export function formatNotDone(status: NotDoneStatus): string {
  return status === 'abandoned' ? 'Abandoned' : 'Skipped';
}

/** A weight as the row shows it — `62.5`, no unit (the column header says `kg`). */
export function formatRowWeight(weight: number): string {
  return String(weight);
}

/**
 * What the Weight field starts with (08.7, "Строка подхода"): the **value** of `suggestedWeight`,
 * or empty — the field then shows its `–` placeholder.
 *
 * A pure bodyweight exercise has no `suggestedWeight` at all (task 105) and takes the block's body
 * weight instead: its load is you, and the block already knows what you weigh. A
 * `bodyweight-weighted` one is ordinary here — its `suggestedWeight` *is* the added weight.
 */
export function initialWeightText(
  row: Pick<WorkoutSetRow, 'suggestedWeight'>,
  equipment?: Equipment,
  bodyWeight?: number,
): string {
  if (isPureBodyWeight(equipment)) {
    return bodyWeight !== undefined ? formatRowWeight(bodyWeight) : '';
  }
  return row.suggestedWeight !== undefined ? formatRowWeight(row.suggestedWeight) : '';
}

/**
 * What a logged row shows in the Weight column. On a `bodyweight-weighted` exercise, the body
 * weight it was logged with and the weight hung on it, kept apart — `83 (+5)`, not their sum
 * (task 105, Artem's review: the sum hides both numbers you actually want to read back). With no
 * body weight recorded there's only the added weight to show. Everything else reads as the plain
 * number it always did.
 */
export function formatLoggedWeight(
  log: { weight: number; bodyWeight?: number },
  equipment?: Equipment,
): string {
  if (!usesAddedWeight(equipment)) {
    return formatRowWeight(log.weight);
  }
  const added = `(+${formatRowWeight(log.weight)})`;
  return log.bodyWeight === undefined
    ? added
    : `${formatRowWeight(log.bodyWeight)} ${added}`;
}

/**
 * What the weight now in this row's Weight field is worth against the row's own target (03, rule
 * 7; task 120). `undefined` while the field holds no number, or when the set has no swap to read
 * — a deload set, a pure `bodyweight` one, or one with no target behind it.
 *
 * The field holds what the row states: the added weight on a `bodyweight-weighted` exercise, the
 * weight lifted on any other, which is exactly what `evaluateWeightSwap` expects.
 */
export function rowEvaluation(
  row: Pick<WorkoutSetRow, 'weightSwap'>,
  weightText: string,
): WeightSwapEvaluation | undefined {
  const weight = parseWeight(weightText);
  return weight === null ? undefined : evaluateWeightSwap(row.weightSwap, weight);
}

/** The number the Reps placeholder shows, and whether it is only an estimate (`~19`). */
export type PlaceholderReps = { reps: number; isEstimate: boolean };

/**
 * The rep count the Reps field suggests, which is also the one a one-tap Log records (task 104).
 * `undefined` when there is no number to suggest — the placeholder falls back to `N RIR` and Log
 * waits for typed reps.
 *
 * With a weight in the field that isn't the one the target was issued for, the number is what
 * *that* weight is worth (08.7.1): a close weight reads as an ordinary target, a far one as an
 * estimate, and a weight off the rep corridor has no target at all. Without an evaluation it is
 * the set's own `targetReps`, or — in a deload — last working week's reps as a guide.
 */
export function placeholderReps(
  row: Pick<WorkoutSetRow, 'targetReps' | 'referenceReps'>,
  evaluation?: WeightSwapEvaluation,
): PlaceholderReps | undefined {
  if (evaluation !== undefined) {
    return evaluation.zone === 'out'
      ? undefined
      : { reps: evaluation.reps, isEstimate: evaluation.zone === 'estimate' };
  }
  if (row.targetReps !== undefined) {
    return { reps: row.targetReps, isEstimate: false };
  }
  if (row.referenceReps !== undefined) {
    return { reps: row.referenceReps, isEstimate: false };
  }
  return undefined;
}

/**
 * The Reps field's placeholder — the field itself starts empty (08.7, "Строка подхода"): the reps
 * to aim for, `~` in front when they are an estimate, and the exercise's target RIR when there is
 * no number to aim for.
 */
export function repsPlaceholder(
  row: Pick<WorkoutSetRow, 'targetReps' | 'referenceReps'>,
  targetRir: number | undefined,
  evaluation?: WeightSwapEvaluation,
): string {
  const placeholder = placeholderReps(row, evaluation);
  if (placeholder !== undefined) {
    return placeholder.isEstimate ? `~${placeholder.reps}` : String(placeholder.reps);
  }
  return targetRir !== undefined ? formatRir(targetRir) : '–';
}

/**
 * Whether the Reps placeholder is the `N RIR` fallback — it's set smaller than a number so it fits
 * the field.
 */
export function isRirPlaceholder(
  row: Pick<WorkoutSetRow, 'targetReps' | 'referenceReps'>,
  targetRir: number | undefined,
  evaluation?: WeightSwapEvaluation,
): boolean {
  return placeholderReps(row, evaluation) === undefined && targetRir !== undefined;
}

/** On target or over it reads a step brighter than under it (08.7 mockup) — both neutral text. */
export function isStrongIndicator(indicator: TargetIndicator): boolean {
  return indicator.kind !== 'under';
}

/** `✓` hit, `+N` over the target, `−N` under it. */
export function formatIndicator(indicator: TargetIndicator): string {
  switch (indicator.kind) {
    case 'hit':
      return '✓';
    case 'over':
      return `+${indicator.diff}`;
    case 'under':
      return `−${indicator.diff}`;
  }
}

/** The Weight field's text as a number — a decimal comma counts too. `null` if empty or not one. */
export function parseWeight(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(normalized)) {
    return null;
  }
  return Number(normalized);
}

/** The Reps field's text as a whole number. `null` if empty or not one. */
export function parseReps(text: string): number | null {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

/**
 * The entry the Log button records, or `null` while it can't be logged — the button is inactive
 * then. Weight is what the field holds (it starts with the suggested weight as a value). Reps are
 * what was typed; an empty Reps field takes whatever number the placeholder shows — the set's
 * `targetReps`, or in a deload last week's `referenceReps` (task 104). Either way a row left as
 * recommended logs with one tap, on every week alike; type your own if you did something else.
 * `N RIR` is the exception: it isn't a rep count, so with that placeholder an empty field keeps Log
 * inactive — which now also covers a weight the rep corridor doesn't reach (08.7.1, zone `out`).
 * The rules for a valid entry are the domain's (`validateSetEntry`), not repeated here.
 */
export function resolveSetEntry(
  weightText: string,
  repsText: string,
  row: Pick<WorkoutSetRow, 'targetReps' | 'referenceReps'>,
  evaluation?: WeightSwapEvaluation,
): { weight: number; reps: number } | null {
  const reps =
    repsText.trim() === ''
      ? (placeholderReps(row, evaluation)?.reps ?? null)
      : parseReps(repsText);
  const entry = { weight: parseWeight(weightText), reps };
  try {
    validateSetEntry(entry);
    return entry;
  } catch {
    return null;
  }
}
