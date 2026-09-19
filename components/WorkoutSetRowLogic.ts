// Pure helpers behind components/WorkoutSetRow.tsx — see the code-style skill.

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
 */
export function initialWeightText(row: Pick<WorkoutSetRow, 'suggestedWeight'>): string {
  return row.suggestedWeight !== undefined ? formatRowWeight(row.suggestedWeight) : '';
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
 * The entry the Log button would record, or `null` while it can't be logged — the button is
 * inactive then. Only what's typed counts: a placeholder isn't a value (05, "Записать подход"),
 * so an empty field is never filled in from it. The rules for a valid entry are the domain's
 * (`validateSetEntry`), not repeated here.
 */
export function parseSetEntry(
  weightText: string,
  repsText: string,
): { weight: number; reps: number } | null {
  const entry = { weight: parseWeight(weightText), reps: parseReps(repsText) };
  try {
    validateSetEntry(entry);
    return entry;
  } catch {
    return null;
  }
}
