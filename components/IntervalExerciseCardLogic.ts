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

export const ROUND_COLUMN = 'Round';
export const WORK_COLUMN = 'Work';
export const REST_COLUMN = 'Rest';

/** What a Rest cell reads with no rest to show — a round with no planned rest at all. */
export const NO_REST = '–';

/**
 * What one tap on a round's Log box logs (FR-7, "запасной путь"): the times its Work and Rest
 * fields hold — the round's planned ones until the picker can change them (GT-90).
 */
export function roundEntryOf(round: WorkoutRoundRow): RoundEntry {
  return round.restSec === undefined
    ? { workSec: round.workSec }
    : { workSec: round.workSec, restSec: round.restSec };
}

/**
 * The rounds the timer runs (FR-6, FR-7): every round not yet logged, from the first, with the times
 * their fields show — a time picked but not yet logged included (FR-9). A round without a rest of
 * its own rests 0.
 */
export function timerRoundsOf(rounds: readonly WorkoutRoundRow[]): IntervalTimerRound[] {
  return rounds
    .filter((round) => round.log === undefined)
    .map((round) => ({
      roundNumber: round.roundNumber,
      workSec: round.workSec,
      restSec: round.restSec ?? 0,
    }));
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
 * the step a week of every round done buys, what a missed round does, and this week's value.
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
