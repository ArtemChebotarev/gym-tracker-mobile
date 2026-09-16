// Mesocycles tab route — wires components/MesocyclesScreen.tsx (08.3 · Мезоциклы — список, task
// 074) to real data and navigation.
//
// Several destinations don't exist yet, so they're explicit "not available yet" popups rather
// than buttons that silently do nothing:
// - Start → the Start scenario itself is task 042 (materializing week 1 into sessions).
// - Edit → the editor (app/meso-editor/new.tsx) only creates; loading a saved planned mesocycle
//   back into it isn't built.
// - Completed Copy → Flow C, not yet specified as a screen (074: "можно оставить точку входа как
//   заглушку").
// - Completed `⋯` → a mesocycle's History screen.
// `+` goes straight to Flow A — Flows B and C have no screens yet to choose between (074's
// temporary option; the final three-flow picker is still Artem's call).

import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { MesocyclesScreen } from '@components/MesocyclesScreen';
import { useDeletePlannedMesocycle } from '@state/useDeletePlannedMesocycle';
import { useMesocycles } from '@state/useMesocycles';

export default function MesocyclesRoute() {
  const router = useRouter();
  const query = useMesocycles();
  const deleteMesocycle = useDeletePlannedMesocycle();

  function showNotAvailable(feature: string) {
    Alert.alert('Not available yet', `${feature} is coming in a later update.`);
  }

  return (
    <MesocyclesScreen
      mesocycles={query.data}
      isPending={query.isPending}
      onRequestCreate={() => router.push('/meso-editor/new')}
      onOpenActive={() => router.navigate('/')}
      onStart={() => showNotAvailable('Starting a mesocycle')}
      onEdit={() => showNotAvailable('Editing a planned mesocycle')}
      onDelete={(mesocycle) =>
        deleteMesocycle.mutate(mesocycle.id, {
          onError: () => {
            Alert.alert("Couldn't delete mesocycle", 'Something went wrong. Please try again.');
          },
        })
      }
      onCopy={() => showNotAvailable('Copying a mesocycle')}
      onOpenHistory={() => showNotAvailable('Mesocycle history')}
    />
  );
}
