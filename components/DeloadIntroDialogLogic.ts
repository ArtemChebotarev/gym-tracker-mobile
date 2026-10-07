// The first-deload popup's copy — 08.11 · Onboarding, "5. Попап первой deload-недели". Working
// text, reworded after the TestFlight feedback; it lives here so that touches this file and not
// the layout.
//
// Facts, not paragraphs (Artem, 07.10.2026): a lead line, then three chips with one short line
// each — what changes, in the shape of the first-weight ladder — and the note about the reps.

import type { PlateTextPart } from '@design/components/PlateText';

export const DELOAD_INTRO_TITLE = 'Deload week';

export const DELOAD_INTRO_BUTTON_LABEL = 'Got it';

export const DELOAD_INTRO_LEAD: readonly PlateTextPart[] = [
  { strong: 'The last week of your cycle.' },
  ' Time to recover before the next one.',
];

export type DeloadFact = { chip: string; text: string };

export const DELOAD_INTRO_FACTS: readonly DeloadFact[] = [
  { chip: 'Half weight', text: 'About half of your usual load' },
  { chip: 'Fewer sets', text: 'Less work to recover from' },
  { chip: '8 RIR', text: "Don't push: finish each set with about 8 reps left" },
];

export const DELOAD_INTRO_NOTE = 'Reps shown are what you did last week, as a guide.';
