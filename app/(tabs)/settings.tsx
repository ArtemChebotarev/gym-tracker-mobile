// Settings tab (08 · Screens & Navigation, "Настройки"; GT-87, GT-188, GT-172). See components/SettingsScreen.tsx.

import { SettingsScreen } from '@components/SettingsScreen';
import { loadErrorOf } from '@state/loadError';
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

  return (
    <SettingsScreen
      restBetweenSets={query.data?.restBetweenSets}
      getReadySec={query.data?.getReadySec}
      signals={query.data?.signals}
      loadError={loadErrorOf(query)}
      onChangeRestBetweenSets={(setting) => setRestBetweenSets.mutate(setting)}
      onChangeGetReadySec={(getReadySec) => setGetReadySec.mutate(getReadySec)}
      onChangeSignals={(signals) => setSignals.mutate(signals)}
    />
  );
}
