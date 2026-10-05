// The Welcome dialog's copy and steps — 08.11 · Onboarding, "1. Welcome". The wording is working
// text, to be reworked after the TestFlight feedback (08.11, "Открытые вопросы"); it lives here so
// that rework touches this file and not the layout.

import type { IconComponent } from '@design/icons/IconFrame';
import { TabCyclesIcon } from '@design/icons/TabCyclesIcon';
import { TabLibraryIcon } from '@design/icons/TabLibraryIcon';
import { TrendIcon } from '@design/icons/TrendIcon';

export const WELCOME_TITLE = 'Progressive training that adapts to you';

export const WELCOME_BUTTON_LABEL = 'Got it';

export type WelcomeStep = {
  icon: IconComponent;
  title: string;
  text: string;
};

export const WELCOME_STEPS: readonly WelcomeStep[] = [
  {
    icon: TabCyclesIcon,
    title: 'Plan a training cycle',
    text: 'Pick your days and exercises.',
  },
  {
    icon: TabLibraryIcon,
    title: 'Find your weight',
    text: 'Choose a load you can handle with a few reps in reserve.',
  },
  {
    icon: TrendIcon,
    title: 'We handle progression',
    text: 'Each workout sets your targets for the next one.',
  },
];
