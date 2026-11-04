// What the coachmark on the first rest's capsule says (08.11 · Onboarding, section 7; GT-219). The
// text depends on the permission, so new and existing users go through one rule. Only someone the
// system has not asked yet is offered `Turn on`, on a line of its own that says what it gives.

import type { PlateTextPart } from '@design/components/PlateText';
import type { NotificationStatus } from '@state/restSignal';

type Paragraph = readonly PlateTextPart[];

export const REST_COACHMARK_TITLE = 'Rest starts after each set';

const WHERE_TO_CHANGE: Paragraph = [
  'Change the time or turn it off in ',
  { strong: 'Settings' },
  '.',
];

export type RestCoachmarkCopy = {
  paragraphs: readonly Paragraph[];
  primaryLabel: string;
  secondaryLabel?: string;
};

export function restCoachmarkCopy(status: NotificationStatus): RestCoachmarkCopy {
  switch (status) {
    case 'undetermined':
      return {
        paragraphs: [
          WHERE_TO_CHANGE,
          ['Turn on notifications to know when rest ends, even with your phone locked.'],
        ],
        primaryLabel: 'Turn on',
        secondaryLabel: 'Not now',
      };
    case 'granted':
      return { paragraphs: [WHERE_TO_CHANGE], primaryLabel: 'Got it' };
    case 'denied':
      return {
        paragraphs: [
          [...WHERE_TO_CHANGE, " Notifications are off, so you'll hear it only in the app."],
        ],
        primaryLabel: 'Got it',
      };
  }
}
