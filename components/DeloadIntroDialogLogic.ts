// The first-deload popup's copy — 08.11 · Onboarding, "5. Попап первой deload-недели". Working
// text, reworded after the TestFlight feedback; it lives here so that touches this file and not
// the layout.
//
// Facts, not paragraphs (Artem, 07.10.2026): a lead line, then three chips with one short line
// each — what changes, in the shape of the first-weight ladder — and the note about the reps.
// The facts depend on what the session holds, so they are a function of it.

import type { PlateTextPart } from '@design/components/PlateText';
import type { ExerciseType } from '@domain/catalog';

import { DELOAD_LOAD_PERCENT } from './RirExplanationLogic';

export const DELOAD_INTRO_TITLE = 'Deload week';

export const DELOAD_INTRO_BUTTON_LABEL = 'Got it';

export const DELOAD_INTRO_LEAD: readonly PlateTextPart[] = [
  { strong: 'The last week of your cycle.' },
  ' Time to recover before the next one.',
];

export type DeloadFact = { chip: string; text: string };

export type DeloadIntroCopy = {
  facts: readonly DeloadFact[];
  /** About the reps guide, so only with set rows on the session to show one. */
  note?: string;
};

const DELOAD_INTRO_NOTE = 'Reps shown are a guide based on last week.';

/**
 * The popup's facts for this session's exercises (GT-166). No version speaks of RIR: the week is
 * set by its load. Power says what strength says, weight or reps, so the session's shape is all
 * that matters: sets, rounds, or both.
 */
export function deloadIntroCopy(exercises: readonly { type?: ExerciseType }[]): DeloadIntroCopy {
  const hasRounds = exercises.some((exercise) => exercise.type === 'interval');
  const hasSets = exercises.some(
    (exercise) => exercise.type !== 'interval' && exercise.type !== 'mobility',
  );
  const load = { chip: `${DELOAD_LOAD_PERCENT}% load` };
  if (hasRounds && !hasSets) {
    return {
      facts: [
        { ...load, text: 'Shorter work in every round' },
        { chip: 'Fewer rounds', text: 'Less work to recover from' },
        { chip: 'Easy rounds', text: "Don't push: this week is for recovery" },
      ],
    };
  }
  return {
    facts: [
      {
        ...load,
        text: hasRounds
          ? 'Less weight, fewer reps or shorter work'
          : 'Less weight, or fewer reps with no weight to cut',
      },
      {
        chip: 'Fewer sets',
        text: hasRounds ? 'And fewer rounds: less to recover from' : 'Less work to recover from',
      },
      { chip: 'Easy sets', text: "Don't push: this week is for recovery" },
    ],
    note: DELOAD_INTRO_NOTE,
  };
}
