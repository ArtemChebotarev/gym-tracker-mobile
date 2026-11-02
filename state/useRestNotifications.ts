// The permission to send notifications, and the first-rest coachmark that asks for it (GT-219,
// 08.11 · Onboarding, section 7). The status is the system's, so it is read rather than stored, and
// read again each time the app comes back: the user may have changed it in the system's Settings.

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { AppState, Linking } from 'react-native';

import {
  type NotificationStatus,
  readNotificationStatus,
  requestNotificationPermission,
} from './restSignal';
import { useRestTimerStore } from './restTimerStore';
import { useOnboardingFlags } from './useOnboardingFlags';

const NOTIFICATION_STATUS_QUERY_KEY = ['notificationStatus'];

/** Undefined until it has been read. */
export function useNotificationStatus(): NotificationStatus | undefined {
  const queryClient = useQueryClient();

  useEffect(() => {
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void queryClient.invalidateQueries({ queryKey: NOTIFICATION_STATUS_QUERY_KEY });
      }
    });
    return () => appState.remove();
  }, [queryClient]);

  return useQuery({
    queryKey: NOTIFICATION_STATUS_QUERY_KEY,
    queryFn: readNotificationStatus,
  }).data;
}

/**
 * `Turn on`: the system prompt the one time it can come up, the system's Settings after that. The
 * new status reaches RestSignalDriver, which sets the signal on the rest that is running.
 */
export function useTurnOnNotifications() {
  const queryClient = useQueryClient();

  return useCallback(
    async (status: NotificationStatus | undefined) => {
      if (status !== 'undetermined') {
        await Linking.openSettings();
        return;
      }
      const answer = await requestNotificationPermission();
      queryClient.setQueryData(NOTIFICATION_STATUS_QUERY_KEY, answer);
    },
    [queryClient],
  );
}

/** A rest is running and its coachmark has not been closed: no other coachmark goes up over it. */
export function useRestCoachmarkPending(): boolean {
  const flags = useOnboardingFlags().data;
  const resting = useRestTimerStore((s) => s.timer !== null);
  return flags !== undefined && !flags.restCoachmarkSeen && resting;
}
