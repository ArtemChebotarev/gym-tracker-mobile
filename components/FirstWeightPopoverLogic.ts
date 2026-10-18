// The "Finding your weight" popover's copy and when its ⓘ shows — 08.11 · Onboarding, "4.
// Поповеры". Working text, reworded after the TestFlight feedback so it reads right on any week
// (08.11, "Открытые вопросы"); it lives here so that touches this file, not the layout.

import type { PlateTextPart } from '@design/components/PlateText';
import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment, ExerciseType } from '@domain/catalog';
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

/** Everything the plate says, so a power exercise can say its own in the same layout (GT-81). */
export type FirstWeightCopy = {
  title: string;
  warmUpLabel: string;
  warmUpSteps: readonly PlateTextPart[][];
  warmUpNote: string;
  workingLabel: string;
  workingText: PlateTextPart[];
};

/**
 * A power exercise's load is found for speed, not for reserve: a lifter's ladder of 12 / 8 / 4
 * reps and a stop at so many RIR belong to a set taken near failure, and a power set isn't
 * (10 · Hybrid Exercises). Same layout, its own words.
 */
const POWER_FIRST_WEIGHT_COPY: FirstWeightCopy = {
  title: 'Finding your load',
  warmUpLabel: WARM_UP_LABEL,
  warmUpSteps: [
    [{ strong: '2–3 reps' }, ', light and fast'],
    [{ strong: '2 reps' }, ', close to your working load, still fast'],
  ],
  warmUpNote: WARM_UP_NOTE,
  workingLabel: WORKING_SET_LABEL,
  workingText: [
    'Do one set of ',
    { strong: 'fast reps' },
    ', stop when the speed drops and ',
    { strong: 'log it' },
    ". If every rep stayed fast, that's your load.",
  ],
};

/** The copy of the "Finding your weight" plate for an exercise of this type. */
export function firstWeightCopy(
  type: ExerciseType | undefined,
  targetRir: number | undefined,
): FirstWeightCopy {
  if (type === 'power') {
    return POWER_FIRST_WEIGHT_COPY;
  }
  return {
    title: FIRST_WEIGHT_TITLE,
    warmUpLabel: WARM_UP_LABEL,
    warmUpSteps: WARM_UP_STEPS,
    warmUpNote: WARM_UP_NOTE,
    workingLabel: WORKING_SET_LABEL,
    workingText: workingSetText(targetRir),
  };
}
