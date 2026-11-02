// The first-workout coachmark tour — 08.11 · Onboarding, "3. Коучмарки на первой тренировке" (GT-42,
// GT-214): three steps (the ⓘ in a first column, the RIR badge, the grid button). It shows that the
// hints are there, so it speaks of no exercise type. Each step finds the first card of the day with
// its element, and a step with nothing to ring in this day waits for a workout that has it.
// Working text, reworded after the TestFlight feedback; it lives here so that touches this file.
//
// What a step is — the words, the card and the ref of the element it rings — is built here, from the
// day's cards and the header; drawing the tour and measuring the refs is `CoachmarkTour`.

import type { CoachmarkTourEnd } from '@design/components/CoachmarkTour';
import type { PlateTextPart } from '@design/components/PlateText';
import { InfoIcon } from '@design/icons/InfoIcon';
import type { WorkoutMode } from '@domain/workoutView';
import type { OnboardingFlag, OnboardingFlags } from '@repositories/settings';
import type { WorkoutExercise } from '@usecases/workoutSession';

import { intervalInfo } from './IntervalExerciseCardLogic';
import { showsPowerInfo } from './PowerExerciseCardLogic';
import { rirExplanation, type RirExplanation } from './RirExplanationLogic';
import { showsBandInfo } from './StrengthExerciseCardLogic';
import { weightSwapPopover } from './WeightSwapLogic';
import {
  cardInfoTargets,
  cardLoadEquipment,
  cardRowsOf,
  exerciseCardView,
  firstUnloggedRow,
  setRowsOf,
  targetRirOf,
} from './WorkoutExerciseCardLogic';

// The ⓘ in the text is the real icon, not the character: the character is a thin outline that
// cannot be made heavier and is hard to find in a line of text (Artem, 06.10.2026). The key words
// are strong.
export const INFO_STEP = {
  title: 'Not sure about the load?',
  paragraphs: [
    ['Tap ', { icon: InfoIcon }, ' to ', { strong: "learn more about this exercise's load" }, '.'],
  ] as PlateTextPart[][],
};

export const RANGES_STEP = {
  title: 'Need a different weight?',
  paragraphs: [
    [
      'Tap ',
      { icon: InfoIcon },
      ' to see ',
      { strong: 'which weights work' },
      '. Your reps update as you type.',
    ],
  ] as PlateTextPart[][],
};

export const GRID_STEP = {
  title: 'Cycle overview',
  paragraphs: [
    ['See ', { strong: 'which days are done' }, ' and jump to any workout.'],
  ] as PlateTextPart[][],
};

/** What a step points at: the ⓘ disc of a first column, a RIR chip, or the header's grid button. */
export type CoachmarkTargetId = 'rir' | 'weight' | 'grid';

/** A step without its element: which one it rings, and what it says. The screen holds the refs. */
export type WorkoutCoachmark = {
  target: CoachmarkTargetId;
  /** The card the element is on, in the day's order; the grid button is on none. */
  exerciseIndex?: number;
  title: string;
  paragraphs?: readonly (string | readonly PlateTextPart[])[];
  /** The RIR step explains with a picture and rows rather than paragraphs. */
  explanation?: RirExplanation;
};

/** Which steps are already behind the user. */
export type SeenTourSteps = Pick<OnboardingFlags, 'tourInfoSeen' | 'tourRirSeen' | 'tourGridSeen'>;

export const NO_TOUR_STEPS_SEEN: SeenTourSteps = {
  tourInfoSeen: false,
  tourRirSeen: false,
  tourGridSeen: false,
};

const STEP_FLAG: Record<CoachmarkTargetId, keyof SeenTourSteps> = {
  weight: 'tourInfoSeen',
  rir: 'tourRirSeen',
  grid: 'tourGridSeen',
};

export type WorkoutCoachmarkInput = {
  /** The day's cards, in order. */
  exercises: readonly WorkoutExercise[];
  mode: WorkoutMode;
  isDeload: boolean;
  seen: SeenTourSteps;
};

/** Whether this card has an ⓘ in its first column (08.11, "Правило ⓘ"), by the rule its type draws it by. */
export function hasFirstColumnInfo(
  exercise: WorkoutExercise,
  mode: WorkoutMode,
  isDeload: boolean,
): boolean {
  switch (exercise.type) {
    case 'mobility':
      return false;
    case 'interval':
      return (
        exerciseCardView(mode, exercise, cardRowsOf(exercise.rounds), isDeload).showRows &&
        intervalInfo(exercise.rounds, exercise.progression, mode, isDeload) !== undefined
      );
    case 'power':
      return (
        exerciseCardView(mode, exercise, cardRowsOf(exercise.rows), isDeload).showRows &&
        showsPowerInfo(mode, isDeload)
      );
    case undefined:
    case 'strength': {
      const targetRir = targetRirOf(exercise);
      const showsRows = exerciseCardView(
        mode,
        { ...exercise, targetRir },
        cardRowsOf(exercise.rows),
        isDeload,
      ).showRows;
      const weight = cardInfoTargets(
        { ...exercise, targetRir, loadEquipment: cardLoadEquipment(exercise) },
        exercise.rows,
        mode,
        isDeload,
      ).weight;
      return weight || (showsRows && showsBandInfo(mode, isDeload, exercise.equipment));
    }
  }
}

/** Whether this card has the `N RIR` badge — the same test the card draws it by. */
function hasRirBadge(exercise: WorkoutExercise, mode: WorkoutMode, isDeload: boolean): boolean {
  const targetRir = targetRirOf(exercise);
  return cardInfoTargets({ ...exercise, targetRir }, setRowsOf(exercise), mode, isDeload).rir;
}

/**
 * The steps this workout's tour has: those not seen yet whose element is in this day, each on the
 * first card that has it. The counter says `N of M` with the M that is left. A step left out waits:
 * only what was shown is written down (`tourStepsSeen`), so it comes up on its own in a later
 * workout.
 *
 * Refs stay out of this on purpose — it only says which element each step is about, and the screen,
 * which owns the refs, puts them in. That keeps it a plain function of the data, and keeps refs out
 * of function calls made during render.
 */
export function workoutCoachmarks({
  exercises,
  mode,
  isDeload,
  seen,
}: WorkoutCoachmarkInput): WorkoutCoachmark[] {
  const steps: WorkoutCoachmark[] = [];

  const infoIndex = exercises.findIndex((exercise) => hasFirstColumnInfo(exercise, mode, isDeload));
  if (!seen.tourInfoSeen && infoIndex >= 0) {
    steps.push({ target: 'weight', exerciseIndex: infoIndex, ...INFO_STEP });
  }
  const rirIndex = exercises.findIndex((exercise) => hasRirBadge(exercise, mode, isDeload));
  const rirExercise = exercises[rirIndex];
  const targetRir = rirExercise === undefined ? undefined : targetRirOf(rirExercise);
  if (!seen.tourRirSeen && targetRir !== undefined) {
    const explanation = rirExplanation({ targetRir });
    steps.push({ target: 'rir', exerciseIndex: rirIndex, title: explanation.title, explanation });
  }
  if (!seen.tourGridSeen) {
    steps.push({ target: 'grid', ...GRID_STEP });
  }

  return steps;
}

/** Whether a card still has work to log: a set or a round, of an exercise that isn't closed. */
function hasWorkLeft(exercise: WorkoutExercise): boolean {
  const rows = setRowsOf(exercise) ?? ('rounds' in exercise ? exercise.rounds : []);
  return rows.some((row) => row.isFirstUnlogged && row.notDone === undefined);
}

/**
 * The card the weight ranges coachmark stands on (08.11, "Коучмарк диапазонов веса"), or `undefined`
 * while there is none. That is the current card — the first with work left — once its ⓘ shows
 * ranges, so a day that opens with something else gets to it in its turn, and the words arrive when
 * they can be used. The trigger is the plate, not a week number.
 */
export function rangesCoachmarkIndex(
  exercises: readonly WorkoutExercise[],
  mode: WorkoutMode,
  isDeload: boolean,
): number | undefined {
  const index = exercises.findIndex(hasWorkLeft);
  const exercise = exercises[index];
  if (exercise === undefined || !('rows' in exercise) || exercise.type === 'power') {
    return undefined;
  }
  const targetRir = targetRirOf(exercise);
  const showsWeightInfo = cardInfoTargets(
    { ...exercise, targetRir },
    exercise.rows,
    mode,
    isDeload,
  ).weight;
  return showsWeightInfo && weightSwapPopover(firstUnloggedRow(exercise.rows)) !== undefined
    ? index
    : undefined;
}

/**
 * What the end of the tour writes down (08.11, "Хранение"): `Got it` — the steps that were shown,
 * the rest still wait; `Skip` — all of it.
 */
export function tourStepsSeen(
  steps: readonly WorkoutCoachmark[],
  end: CoachmarkTourEnd,
): OnboardingFlag[] {
  return end === 'skipped' ? ['coachmarksSeen'] : steps.map((step) => STEP_FLAG[step.target]);
}

// Where a ringed element may stand, as shares of the window: below the header, and high enough for
// the bubble to fit under it. Not a design value — it is about where a screen's content lands.
const TOUR_TOP = 0.2;
const TOUR_BOTTOM = 0.5;
const TOUR_LANDING = 0.3;

export type TourScrollInput = {
  /** The list's own scroll position. */
  y: number;
  contentHeight: number;
  viewportHeight: number;
  /** The element in window coordinates. */
  targetY: number;
  windowHeight: number;
};

/**
 * Where to scroll the list so a step's element can be ringed, or `undefined` when it already stands
 * well. Kept inside the list's range: a scroll past the end would stay there.
 */
export function tourScrollOffset({
  y,
  contentHeight,
  viewportHeight,
  targetY,
  windowHeight,
}: TourScrollInput): number | undefined {
  if (targetY >= windowHeight * TOUR_TOP && targetY <= windowHeight * TOUR_BOTTOM) {
    return undefined;
  }
  const wanted = y + targetY - windowHeight * TOUR_LANDING;
  const offset = Math.min(Math.max(wanted, 0), Math.max(contentHeight - viewportHeight, 0));
  return offset === y ? undefined : offset;
}
