// The "Finding your weight" popover's copy and when its ⓘ shows — 08.11 · Onboarding, "4.
// Поповеры". Working text, reworded after the TestFlight feedback so it reads right on any week
// (08.11, "Открытые вопросы"); it lives here so that touches this file, not the layout.

import type { PlateTextPart } from '@design/components/PlateText';
import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment } from '@domain/catalog';
import type { WorkoutMode } from '@domain/workoutView';

// "Finding your weight", not "…first weight": the ⓘ is on every week's card, and the ladder is how
// to find the load on any of them (Artem, 06.10.2026).
export const FIRST_WEIGHT_TITLE = 'Finding your weight';

// Said as what it is for — a warm-up *before your first set* — because "Warm up" alone read as a
// recommendation of working sets (07.10.2026, a gym-goer new to the programme).
export const WARM_UP_LABEL = 'Warm up before your first set';

/** The ladder: lighter and longer first, heavier and shorter after (12 / 8 / 4 reps). */
export const WARM_UP_STEPS: readonly PlateTextPart[][] = [
  [{ strong: '12 reps' }, ', light weight'],
  [{ strong: '8 reps' }, ', heavier'],
  [{ strong: '4 reps' }, ', close to your working weight'],
];

export const WARM_UP_NOTE = "Warm-up sets aren't logged here.";

/** The block that is logged, named by its usual name; the line under it says to log it. */
export const WORKING_SET_LABEL = 'Then your working set';

const WORKING_SET_TAIL = " If it felt right, that's your weight.";

/**
 * The working set's line — the RIR is the exercise's own target, so it's right on any week. A
 * session exercise may have none recorded; the sentence then says it without a number. And at the
 * last week's 0 RIR the target is failure, said as that: "stop at 0 RIR" reads as a typo (Artem,
 * 06.10.2026).
 */
export function workingSetText(targetRir: number | undefined): PlateTextPart[] {
  const stop =
    targetRir === undefined
      ? 'stop a few reps short of failure'
      : targetRir === 0
        ? 'go to failure'
        : `stop at ${targetRir} RIR`;
  return ['Do one set, ', { strong: stop }, ' and ', { strong: 'log it' }, `.${WORKING_SET_TAIL}`];
}

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
