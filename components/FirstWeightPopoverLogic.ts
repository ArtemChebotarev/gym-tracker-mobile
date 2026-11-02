// The "Finding your weight" popover's copy and when its ⓘ shows — 08.11 · Onboarding, "4.
// Поповеры". Working text, reworded after the TestFlight feedback so it reads right on any week
// (08.11, "Открытые вопросы"); it lives here so that touches this file, not the layout.

import type { PlateTextPart } from '@design/components/PlateText';
import { isPureBodyWeight } from '@domain/bodyWeightLoad';
import type { Equipment, ExerciseType } from '@domain/catalog';
import type { PowerLoad } from '@domain/exerciseConfig';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { POWER_MAX_REPS, POWER_MIN_REPS } from '@domain/progressionCorridor';
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

/** The box that is logged, named by its usual name; the line in it says to log it. */
export const WORKING_SET_LABEL = 'Working set';

const WORKING_SET_TAIL = " If it felt right, that's your weight.";

/**
 * The working set's line — the corridor a set has to land in, which the engine builds its targets
 * on (03), and the RIR, the exercise's own target, so it's right on any week. A session exercise
 * may have none recorded; the sentence then says it without a number. And at the last week's 0 RIR
 * the target is failure, said as that: "stop at 0 RIR" reads as a typo (Artem, 06.10.2026).
 */
export function workingSetText(targetRir: number | undefined): PlateTextPart[] {
  const stop =
    targetRir === undefined
      ? 'stop a few reps short of failure'
      : targetRir === 0
        ? 'go to failure'
        : `stop at ${targetRir} RIR`;
  const { minReps, maxReps } = defaultProgressionSettings;
  return [
    'Do one set of ',
    { strong: `${minReps}–${maxReps} reps` },
    ', ',
    { strong: stop },
    ' and ',
    { strong: 'log it' },
    `.${WORKING_SET_TAIL}`,
  ];
}

/**
 * Whether the Weight header gets its ⓘ: on a live workout, any week but a deload — there the weight
 * is already filled in — and not on a pure bodyweight exercise, whose Weight field is the body
 * weight rather than a load to find. What it opens is `weightSwapPopover`'s ranges, if there are
 * any, and this plate if not (08.11, "Правило ⓘ").
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
  /** A line under the title, before the warm-up — what the load even is, when that needs saying. */
  intro?: string;
  warmUpLabel: string;
  warmUpSteps: readonly PlateTextPart[][];
  warmUpNote: string;
  workingLabel: string;
  workingText: PlateTextPart[];
};

/**
 * A power exercise's load is found for speed, not for reserve: a lifter's ladder and a stop at so
 * many RIR belong to a set taken near failure, and a power set isn't (10 · Hybrid Exercises).
 *
 * One warm-up line for every load, with no ladder: a ladder promises something lighter, and a 4 kg
 * ball or the first level has nothing below it (Artem, 02.11.2026). The working set is what tells
 * whether the load is right.
 */
const POWER_WARM_UP_STEPS: readonly PlateTextPart[][] = [
  ['Warm up with ', { strong: 'a few easy, fast reps' }, '.'],
];

function powerWorkingText(tail: string): PlateTextPart[] {
  return [
    'Do one set of ',
    { strong: `${POWER_MIN_REPS}–${POWER_MAX_REPS} fast reps` },
    ', stop when ',
    { strong: 'the speed drops' },
    ' and ',
    { strong: 'log it' },
    `.${tail}`,
  ];
}

const POWER_COPY_FRAME = {
  warmUpLabel: WARM_UP_LABEL,
  warmUpSteps: POWER_WARM_UP_STEPS,
  warmUpNote: WARM_UP_NOTE,
  workingLabel: WORKING_SET_LABEL,
};

const POWER_COPY: Record<PowerLoad, FirstWeightCopy> = {
  weight: {
    ...POWER_COPY_FRAME,
    title: 'Finding your load',
    workingText: powerWorkingText(" If every rep stayed fast, that's your load."),
  },
  // What each level is was the user's own call: the app only knows the numbers (10.1 FR-2). So the
  // plate says that first (Artem's review, 18.10.2026).
  level: {
    ...POWER_COPY_FRAME,
    title: 'Finding your level',
    intro:
      'Levels are your own: 1 is the easiest you have, like the lowest box, and each number up is harder.',
    workingText: powerWorkingText(" If every rep stayed fast, that's your level."),
  },
  // No load, nothing to find: only the set itself.
  none: {
    ...POWER_COPY_FRAME,
    title: 'Fast reps',
    workingText: powerWorkingText(''),
  },
};

/**
 * The copy of the "Finding your weight" plate for an exercise of this type — and, for power, of
 * this load.
 */
export function firstWeightCopy(
  type: ExerciseType | undefined,
  targetRir: number | undefined,
  powerLoad?: PowerLoad,
): FirstWeightCopy {
  if (type === 'power') {
    return POWER_COPY[powerLoad ?? 'weight'];
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
