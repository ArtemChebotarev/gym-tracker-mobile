// The one-step coachmark on the capsule of the first rest (08.11 · Onboarding, section 7; GT-219).
// The rest runs on under it. It closes for good either way, and only `Turn on` brings up the system
// prompt; the rest that is running then gets its notification. With the rest timer off no rest
// starts, so neither this nor the prompt ever comes up. It sits with the capsule, in the tab bar's
// overlay, so it goes up whichever tab is open.

import type { RefObject } from 'react';
import type { View } from 'react-native';

import { CoachmarkTour, type CoachmarkTourEnd } from '@design/components/CoachmarkTour';
import { RADII } from '@design/tokens';
import { useMarkOnboardingSeen } from '@state/useOnboardingFlags';
import {
  useNotificationStatus,
  useRestCoachmarkPending,
  useTurnOnNotifications,
} from '@state/useRestNotifications';

import { REST_COACHMARK_TITLE, restCoachmarkCopy } from './RestCoachmarkLogic';
import { useDelayedFlag } from './useDelayedFlag';

// The capsule has just come up: it is measured once it has settled over the tab bar.
const REST_COACHMARK_DELAY_MS = 400;

export function RestCoachmark({ capsuleRef }: { capsuleRef: RefObject<View | null> }) {
  const status = useNotificationStatus();
  const pending = useRestCoachmarkPending();
  const due = useDelayedFlag(pending && status !== undefined, REST_COACHMARK_DELAY_MS);
  const markSeen = useMarkOnboardingSeen();
  const turnOn = useTurnOnNotifications();

  if (status === undefined) {
    return null;
  }
  const { paragraphs, primaryLabel, secondaryLabel } = restCoachmarkCopy(status);

  function handleFinish(end: CoachmarkTourEnd) {
    markSeen.mutate('restCoachmarkSeen');
    if (end === 'completed' && status === 'undetermined') {
      void turnOn(status);
    }
  }

  return (
    <CoachmarkTour
      visible={due}
      steps={[
        {
          targetRef: capsuleRef,
          title: REST_COACHMARK_TITLE,
          paragraphs,
          ringRadius: RADII['radius/capsule'],
          primaryLabel,
          ...(secondaryLabel !== undefined ? { secondaryLabel } : {}),
        },
      ]}
      onFinish={handleFinish}
    />
  );
}
