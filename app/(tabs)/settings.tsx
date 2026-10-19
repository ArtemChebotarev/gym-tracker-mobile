// Settings tab (08 · Screens & Navigation, "Настройки"; GT-87). See components/SettingsScreen.tsx.

import { SettingsScreen } from '@components/SettingsScreen';
import { loadErrorOf } from '@state/loadError';
import { useSetStrengthRestTimer, useStrengthRestTimer } from '@state/useStrengthRestTimer';

export default function SettingsRoute() {
  const query = useStrengthRestTimer();
  const setStrengthRestTimer = useSetStrengthRestTimer();

  return (
    <SettingsScreen
      strengthRestTimer={query.data}
      loadError={loadErrorOf(query)}
      onChangeStrengthRestTimer={(setting) => setStrengthRestTimer.mutate(setting)}
    />
  );
}
