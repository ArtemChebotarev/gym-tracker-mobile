// Presentational Mesocycles stub screen — see 08.5 · Редактор мезоцикла — Flow A. The "+"
// button is the flow's entry point (task 075: "точка входа в флоу — кнопка + в шапке текущего
// стаб-экрана Mesocycles"), pulled out of the route file (mirroring ExerciseLibraryScreen.tsx)
// so it can be tested with a plain onRequestCreate prop, without a real navigation context. The
// rest of the screen stays a stub — 074 builds the real list.

import { Text } from 'react-native';

import { IconButton } from '@design/components/IconButton';
import { RootScreen } from '@design/components/RootScreen';

import { styles } from './MesocyclesScreenStyles';

export type MesocyclesScreenProps = {
  onRequestCreate: () => void;
};

export function MesocyclesScreen({ onRequestCreate }: MesocyclesScreenProps) {
  return (
    <RootScreen
      title="Mesocycles"
      trailing={
        <IconButton accessibilityLabel="New mesocycle" variant="accent" onPress={onRequestCreate}>
          <Text style={styles.addIcon}>+</Text>
        </IconButton>
      }
    >
      <Text style={styles.placeholder}>Mesocycles</Text>
    </RootScreen>
  );
}
