// Pure helpers behind components/WorkoutSetRow.tsx — see the code-style skill.

import { isPureBodyWeight, usesAddedWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { TargetIndicator } from '@domain/execution';
import { validateSetEntry } from '@domain/executionValidators';
import type { WorkoutSetRow } from '@usecases/workoutSession';

import { formatRir } from './WorkoutExerciseCardLogic';

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
 * The Reps field's placeholder — the field itself starts empty (08.7, "Строка подхода"):
 * `targetReps` when the set has one; in a deload, last week's actual reps as a guide; otherwise the
 * exercise's target RIR.
 */
export function repsPlaceholder(
  row: Pick<WorkoutSetRow, 'targetReps' | 'referenceReps'>,
  targetRir: number | undefined,
): string {
  if (row.targetReps !== undefined) {
    return String(row.targetReps);
  }
  if (row.referenceReps !== undefined) {
    return String(row.referenceReps);
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
): boolean {
  return row.targetReps === undefined && row.referenceReps === undefined && targetRir !== undefined;
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
 * inactive. The rules for a valid entry are the domain's (`validateSetEntry`), not repeated here.
 */
export function resolveSetEntry(
  weightText: string,
  repsText: string,
  row: Pick<WorkoutSetRow, 'targetReps' | 'referenceReps'>,
): { weight: number; reps: number } | null {
  const reps =
    repsText.trim() === '' ? (row.targetReps ?? row.referenceReps ?? null) : parseReps(repsText);
  const entry = { weight: parseWeight(weightText), reps };
  try {
    validateSetEntry(entry);
    return entry;
  } catch {
    return null;
  }
}
