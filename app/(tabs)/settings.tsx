// Settings tab (08 · Screens & Navigation, "Настройки"; GT-87, GT-188, GT-172). See components/SettingsScreen.tsx.

import { Linking } from 'react-native';

import { restNotificationsView } from '@components/RestNotificationsSectionLogic';
import { SettingsScreen } from '@components/SettingsScreen';
import { loadErrorOf } from '@state/loadError';
import { useMarkOnboardingSeen, useOnboardingFlags } from '@state/useOnboardingFlags';
import { useNotificationStatus, useTurnOnNotifications } from '@state/useRestNotifications';
import {
  useSetGetReadySec,
  useSetRestBetweenSets,
  useSetSignals,
  useTimerSettings,
} from '@state/useTimerSettings';

export default function SettingsRoute() {
  const query = useTimerSettings();
  const setRestBetweenSets = useSetRestBetweenSets();
  const setGetReadySec = useSetGetReadySec();
  const setSignals = useSetSignals();
  const flags = useOnboardingFlags().data;
  const status = useNotificationStatus();
  const turnOn = useTurnOnNotifications();
  const markSeen = useMarkOnboardingSeen();

  return (
    <SettingsScreen
      restBetweenSets={query.data?.restBetweenSets}
      getReadySec={query.data?.getReadySec}
      signals={query.data?.signals}
      {...(status !== undefined && flags !== undefined
        ? {
            notifications: {
              view: restNotificationsView(status, flags.restNotificationsPlateHidden),
              onTurnOn: () => void turnOn(status),
              onChange: () => void Linking.openSettings(),
              onHidePlate: () => markSeen.mutate('restNotificationsPlateHidden'),
            },
          }
        : {})}
      loadError={loadErrorOf(query)}
      onChangeRestBetweenSets={(setting) => setRestBetweenSets.mutate(setting)}
      onChangeGetReadySec={(getReadySec) => setGetReadySec.mutate(getReadySec)}
      onChangeSignals={(signals) => setSignals.mutate(signals)}
    />
  );
}
