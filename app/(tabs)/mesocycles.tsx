// Mesocycles tab route — wires components/MesocyclesScreen.tsx (08.3 · Мезоциклы — список, task
// 074) to real data and navigation.
//
// Start (042) materializes week 1 and the list refreshes in place: the mesocycle moves up into the
// Active card, which leads on to the Today tab.
// Several destinations don't exist yet, so they're explicit "not available yet" popups rather
// than buttons that silently do nothing:
// - Completed Copy → Flow C, not yet specified as a screen (074: "можно оставить точку входа как
//   заглушку").
// - Completed `⋯` → a mesocycle's History screen.
// Planned `⋯` → Edit opens the same editor on that mesocycle (app/meso-editor/edit/[id].tsx), with
// that mesocycle loaded into the editor draft first.
// The Active card's current week comes from the mesocycle's grid (useMesoGrid, 089) — its sessions,
// not the calendar — so a break of a few days between workouts doesn't move it.
// `+` goes straight to Flow A — Flows B and C have no screens yet to choose between (074's
// temporary option; the final three-flow picker is still Artem's call).

import { Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { MesocyclesScreen } from '@components/MesocyclesScreen';
import { toMesoBuilderDraft, useDraftStore } from '@state/draftStore';
import { useDeletePlannedMesocycle } from '@state/useDeletePlannedMesocycle';
import { useMesoGrid } from '@state/useMesoGrid';
import { useMesocycles } from '@state/useMesocycles';
import { useStartMesocycle } from '@state/useStartMesocycle';

export default function MesocyclesRoute() {
  const router = useRouter();
  const query = useMesocycles();
  const activeId = query.data?.find((mesocycle) => mesocycle.status === 'active')?.id;
  const activeGrid = useMesoGrid(activeId);
  const deleteMesocycle = useDeletePlannedMesocycle();
  const startMesocycle = useStartMesocycle();
  const setDraft = useDraftStore((state) => state.setMesoBuilder);

  function showNotAvailable(feature: string) {
    Alert.alert('Not available yet', `${feature} is coming in a later update.`);
  }

  return (
    <MesocyclesScreen
      mesocycles={query.data}
      isPending={query.isPending || (activeId !== undefined && activeGrid.isPending)}
      activeWeekNumber={activeGrid.data?.currentWeekNumber ?? 1}
      onRequestCreate={() => router.push('/meso-editor/new')}
      onOpenActive={() => router.navigate('/')}
      onStart={(mesocycle) =>
        startMesocycle.mutate(mesocycle.id, {
          onError: () => {
            Alert.alert("Couldn't start mesocycle", 'Something went wrong. Please try again.');
          },
        })
      }
      onEdit={(mesocycle) => {
        setDraft(toMesoBuilderDraft(mesocycle));
        router.push({ pathname: '/meso-editor/edit/[id]', params: { id: mesocycle.id } });
      }}
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
