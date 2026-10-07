// The first-deload popup's copy — 08.11 · Onboarding, "5. Попап первой deload-недели". Working
// text, reworded after the TestFlight feedback; it lives here so that touches this file and not
// the layout.

import type { PlateTextPart } from '@design/components/PlateText';

export const DELOAD_INTRO_TITLE = 'Deload week';

export const DELOAD_INTRO_BUTTON_LABEL = 'Got it';

export const DELOAD_INTRO_PARAGRAPHS: readonly (readonly PlateTextPart[])[] = [
  [
    'This is the last week of your cycle. Weights drop to ',
    { strong: 'about half' },
    ' and there are fewer sets, so your body can recover before the next one.',
  ],
  [
    "Don't push: aim to finish each set with ",
    { strong: 'about 8 reps left' },
    '. The reps shown are what you did last week, as a guide.',
  ],
];
