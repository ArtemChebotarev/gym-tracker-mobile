// Pure helpers behind components/IntervalExerciseCard.tsx — 10.1 FR-6, FR-8, FR-14. What the card
// writes: its column labels, a round's times, the Start timer button's label and the ⓘ plate of the
// column that progresses. See the code-style skill.

import type { IntervalTimerRound } from '@domain/intervalTimer';
import { CheckIcon } from '@design/icons/CheckIcon';
import { MinusIcon } from '@design/icons/MinusIcon';
import { TrendIcon } from '@design/icons/TrendIcon';
import { formatClock } from '@design/formatClock';
import type { RoundEntry } from '@domain/executionValidators';
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
 * The plate of the ⓘ beside the column that progresses (FR-8; canvas 1.6, "Tap ⓘ next to Rest"):
 * the step a week of every round done buys, what a missed round does, and this week's value — none
 * on a week whose rounds have no time yet (FR-9).
 */
export function intervalProgressionPlate(
  progression: IntervalProgression,
  rounds: readonly WorkoutRoundRow[],
): BadgeExplanation {
  const rest = progression.column === 'rest';
  const step = `${progression.stepSec} s ${rest ? 'shorter' : 'longer'}`;
  const thisWeek = rest
    ? rounds.find((round) => round.restSec !== undefined)?.restSec
    : rounds[0]?.workSec;
  return {
    title: rest ? 'Less rest each week' : 'More work each week',
    rows: [
      {
        icon: CheckIcon,
        text: [
          'Finish every round: ',
          rest ? 'rest' : 'work',
          ' gets ',
          { strong: step },
          ' next week.',
        ],
      },
      { icon: MinusIcon, text: ['Miss a round: the plan ', { strong: 'repeats' }, '.'] },
      ...(thisWeek === undefined
        ? []
        : [{ icon: TrendIcon, text: ['This week ', { strong: formatClock(thisWeek) }, '.'] }]),
    ],
  };
}

/** The accessibility label of the progressing column's ⓘ. */
export function progressionInfoLabel(progression: IntervalProgression): string {
  return progression.column === 'rest' ? 'How rest progresses' : 'How work progresses';
}
