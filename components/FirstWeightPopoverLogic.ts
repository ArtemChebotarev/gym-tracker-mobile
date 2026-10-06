// The "Finding your weight" popover's copy and when its ⓘ shows — 08.11 · Onboarding, "4.
// Поповеры". Working text, reworded after the TestFlight feedback so it reads right on any week
// (08.11, "Открытые вопросы"); it lives here so that touches this file, not the layout.

import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { WorkoutMode } from '@domain/workoutView';

// "Finding your weight", not "…first weight": the ⓘ is on every week's card, and the ladder is how
// to find the load on any of them (Artem, 06.10.2026).
export const FIRST_WEIGHT_TITLE = 'Finding your weight';

export const WARM_UP_LABEL = 'Warm up';

export type WarmUpStep = { reps: string; text: string };

/** The ladder: lighter and longer first, heavier and shorter after (12 / 8 / 4 reps). */
export const WARM_UP_STEPS: readonly WarmUpStep[] = [
  { reps: '12 reps', text: 'Light weight' },
  { reps: '8 reps', text: 'Heavier' },
  { reps: '4 reps', text: 'Close to your working weight' },
];

export const WARM_UP_NOTE = "Warm-up sets aren't logged here.";

/**
 * The bold lead of the summary — the RIR is the exercise's own target, so it's right on any week.
 * A session exercise may have none recorded; the sentence then says it without a number.
 */
export function firstWeightLead(targetRir: number | undefined): string {
  return targetRir === undefined
    ? 'Then do a working set and stop a few reps short of failure.'
    : `Then do a working set and stop at ${targetRir} RIR.`;
}

export const FIRST_WEIGHT_TAIL = "If it felt right, that's your weight.";

/**
 * Whether the Weight header gets its ⓘ: on a live workout, any week but a deload — there the weight
 * is already filled in and so is the Reps ⓘ missing, so the two buttons behave alike — and not on
 * a pure bodyweight exercise, whose Weight field is the body weight rather than a load to find.
 */
export function showsFirstWeightInfo(
  mode: WorkoutMode,
  isDeload: boolean,
  equipment: Equipment | undefined,
): boolean {
  return mode === 'live' && !isDeload && !isPureBodyWeight(equipment);
}
