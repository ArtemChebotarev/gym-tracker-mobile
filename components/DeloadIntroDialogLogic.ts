// The first-deload popup's copy — 08.11 · Onboarding, "5. Попап первой deload-недели". Working
// text, reworded after the TestFlight feedback; it lives here so that touches this file and not
// the layout.
//
// Facts, not paragraphs (Artem, 07.10.2026): a lead line, then three chips with one short line
// each — what changes, in the shape of the first-weight ladder — and the note about the reps.

import type { PlateTextPart } from '@design/components/PlateText';

import { DELOAD_LOAD_PERCENT } from './RirExplanationLogic';

export const DELOAD_INTRO_TITLE = 'Deload week';

export const DELOAD_INTRO_BUTTON_LABEL = 'Got it';

export const DELOAD_INTRO_LEAD: readonly PlateTextPart[] = [
  { strong: 'The last week of your cycle.' },
  ' Time to recover before the next one.',
];

export type DeloadFact = { chip: string; text: string };

/** One text for every session, like the rule itself: this shows once, so it speaks of every type. */
export const DELOAD_INTRO_FACTS: readonly DeloadFact[] = [
  { chip: `${DELOAD_LOAD_PERCENT}% load`, text: 'Less weight, fewer reps or shorter work' },
  { chip: 'Less volume', text: 'Fewer sets and rounds to recover from' },
  { chip: 'Go easy', text: "Don't push: this week is for recovery" },
];

export const DELOAD_INTRO_NOTE = 'Reps shown are a guide based on last week.';
