// Settings tab (08 · Screens & Navigation, "Настройки"; GT-87, GT-188). See components/SettingsScreen.tsx.

import { SettingsScreen } from '@components/SettingsScreen';
import { loadErrorOf } from '@state/loadError';
import {
  useSetGetReadySec,
  useSetRestBetweenSets,
  useTimerSettings,
} from '@state/useTimerSettings';

export default function SettingsRoute() {
  const query = useTimerSettings();
  const setRestBetweenSets = useSetRestBetweenSets();
  const setGetReadySec = useSetGetReadySec();

  return (
    <SettingsScreen
      restBetweenSets={query.data?.restBetweenSets}
      getReadySec={query.data?.getReadySec}
      loadError={loadErrorOf(query)}
      onChangeRestBetweenSets={(setting) => setRestBetweenSets.mutate(setting)}
      onChangeGetReadySec={(getReadySec) => setGetReadySec.mutate(getReadySec)}
    />
  );
}
