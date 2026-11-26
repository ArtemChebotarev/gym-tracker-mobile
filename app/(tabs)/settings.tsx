// Settings tab (08 · Screens & Navigation, "Настройки"; GT-87, GT-188, GT-172, GT-244, GT-262). See components/SettingsScreen.tsx.
//
// The two About pages open in an in-app browser sheet (SFSafariViewController, Done returns here)
// rather than leaving for Safari; `Linking` stays for the system Settings link.

import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { restNotificationsView } from '@components/RestNotificationsSectionLogic';
import { SettingsScreen } from '@components/SettingsScreen';
import { PRIVACY_POLICY_URL, SUPPORT_URL } from '@domain/appLinks';
import { loadErrorOf } from '@state/loadError';
import { useMarkOnboardingSeen, useOnboardingFlags } from '@state/useOnboardingFlags';
import { useNotificationStatus, useTurnOnNotifications } from '@state/useRestNotifications';
import { useDefaultWeightUnit, useSetDefaultWeightUnit } from '@state/useWeightUnitSetting';
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
  const weightUnit = useDefaultWeightUnit().data;
  const setWeightUnit = useSetDefaultWeightUnit();

  return (
    <SettingsScreen
      restBetweenSets={query.data?.restBetweenSets}
      getReadySec={query.data?.getReadySec}
      signals={query.data?.signals}
      weightUnit={weightUnit}
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
      onChangeWeightUnit={(unit) => setWeightUnit.mutate(unit)}
      onOpenPrivacyPolicy={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
      onOpenSupport={() => void WebBrowser.openBrowserAsync(SUPPORT_URL)}
    />
  );
}
