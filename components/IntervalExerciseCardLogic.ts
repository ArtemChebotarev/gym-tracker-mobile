// Pure helpers behind components/IntervalExerciseCard.tsx — 10.1 FR-6, FR-8, FR-14. What the card
// writes: its column labels, a round's times, the Start timer button's label and the plates of its
// ⓘ. See the code-style skill.

import type { IntervalTimerRound } from '@domain/intervalTimer';
import type { PlateTextPart } from '@design/components/PlateText';
import { CheckIcon } from '@design/icons/CheckIcon';
import type { RoundEntry } from '@domain/executionValidators';
import type { WorkoutMode } from '@domain/workoutView';
import type { IntervalProgression, WorkoutRoundRow } from '@usecases/workoutSession';

import type { BadgeExplanation } from './RirExplanationLogic';

export const WORK_COLUMN = 'Work';
export const REST_COLUMN = 'Rest';

/**
 * The line under the rounds while one still has no time (10.1 FR-9, GT-187): why Log and Start timer
 * don't work yet, and what to do about it.
 */
export const PICK_ROUND_TIMES_HINT = 'Pick work and rest to log a round or start the timer.';

/** A round has both its times — picked, or from history — and can be logged and timed (FR-9). */
export function hasRoundTimes(round: WorkoutRoundRow): boolean {
  return round.workSec !== undefined && round.restSec !== undefined;
}

/**
 * What one tap on a round's Log box logs (FR-7, "запасной путь"): the times its Work and Rest
 * fields hold. `undefined` while one of them is empty — the round can't be logged yet (FR-9).
 */
export function roundEntryOf(round: WorkoutRoundRow): RoundEntry | undefined {
  return round.workSec === undefined || round.restSec === undefined
    ? undefined
    : { workSec: round.workSec, restSec: round.restSec };
}

/**
 * The rounds the timer runs (FR-6, FR-7): every round not yet logged, from the first, with the times
 * their fields show — a time picked but not yet logged included (FR-9). `undefined` while one of them
 * has no time: the timer doesn't start on an empty field.
 */
export function timerRoundsOf(
  rounds: readonly WorkoutRoundRow[],
): IntervalTimerRound[] | undefined {
  const timed: IntervalTimerRound[] = [];
  for (const round of rounds) {
    if (round.log !== undefined) {
      continue;
    }
    if (round.workSec === undefined || round.restSec === undefined) {
      return undefined;
    }
    timed.push({ roundNumber: round.roundNumber, workSec: round.workSec, restSec: round.restSec });
  }
  return timed;
}

/** Some round still to do has no time yet — Log and Start timer wait for it, and the hint says so. */
export function lacksRoundTimes(rounds: readonly WorkoutRoundRow[]): boolean {
  return rounds.some(
    (round) => round.log === undefined && round.notDone === undefined && !hasRoundTimes(round),
  );
}

/**
 * The Start timer button's label (08.7, "Interval card"; canvas 1.4, 1.6), or `undefined` once every
 * round is logged and there is nothing left to time. It always counts rounds, the unit the timer
 * runs: with nothing logged yet how many there are, `Start timer · 3 rounds`; once a round is logged
 * by hand, how many are left, `Start timer · 2 rounds left`, since the timer starts from the first
 * unlogged one (FR-7). Not a length: a block's total time reads as the length of one round (Artem,
 * 26.10.2026).
 */
export function startTimerLabel(rounds: readonly WorkoutRoundRow[]): string | undefined {
  const left = rounds.filter((round) => round.log === undefined);
  if (left.length === 0) {
    return undefined;
  }
  const count = `${left.length} ${left.length === 1 ? 'round' : 'rounds'}`;
  return `Start timer · ${left.length < rounds.length ? `${count} left` : count}`;
}

/**
 * The step a week of every round done buys, and nothing else. A missed round and this week's value
 * were here too (GT-104, Artem, 01.11.2026): the first is implied, the second stands in the column.
 */
function progressionLine(progression: IntervalProgression): PlateTextPart[] {
  const rest = progression.column === 'rest';
  const step = `${progression.stepSec} s ${rest ? 'shorter' : 'longer'}`;
  return ['Finish every round: ', rest ? 'rest' : 'work', ' gets ', { strong: step }, ' next week.'];
}

/** The ⓘ's plate once the rounds have their times, on a lever that moves one of them (FR-8). */
export function intervalProgressionPlate(progression: IntervalProgression): BadgeExplanation {
  return {
    title: progression.column === 'rest' ? 'Less rest each week' : 'More work each week',
    rows: [{ icon: CheckIcon, text: progressionLine(progression) }],
  };
}

export const FINDING_TIME_TITLE = 'Finding your time';

/** What to go by in each field. The line about Log and Start timer says what to fill; this, what with. */
export const FINDING_TIME_ROWS: readonly { chip: string; text: string }[] = [
  { chip: WORK_COLUMN, text: 'A time you can hold with good form in every round' },
  { chip: REST_COLUMN, text: 'Enough to start the next round ready' },
];

/** What the ⓘ opens, or `undefined` when there is none. */
export type IntervalInfo =
  | { kind: 'finding-time'; progressionLine?: PlateTextPart[] }
  | { kind: 'progression'; plate: BadgeExplanation; accessibilityLabel: string };

/**
 * The first column's ⓘ (08.11, "Timed work: Work ⓘ"): during a live workout, not on a deload. While
 * a round has no time it says how to pick one, on any lever, with the step on a lever that has one.
 * After that it is the step, so `rounds` and `none` have no ⓘ: nothing to say about them.
 */
export function intervalInfo(
  rounds: readonly WorkoutRoundRow[],
  progression: IntervalProgression | undefined,
  mode: WorkoutMode,
  isDeload: boolean,
): IntervalInfo | undefined {
  if (mode !== 'live' || isDeload) {
    return undefined;
  }
  if (lacksRoundTimes(rounds)) {
    return {
      kind: 'finding-time',
      ...(progression === undefined ? {} : { progressionLine: progressionLine(progression) }),
    };
  }
  return progression === undefined
    ? undefined
    : {
        kind: 'progression',
        plate: intervalProgressionPlate(progression),
        accessibilityLabel: progressionInfoLabel(progression),
      };
}

/** The accessibility label of the ⓘ while it speaks of the step. */
export function progressionInfoLabel(progression: IntervalProgression): string {
  return progression.column === 'rest' ? 'How rest progresses' : 'How work progresses';
}
