// Mesocycles tab route — wires components/MesocyclesScreen.tsx (08.3 · Мезоциклы — список, task
// 074) to real data and navigation.
//
// Start (042) materializes week 1 and the list refreshes in place: the mesocycle moves up into the
// Active card, which leads on to the Today tab.
// Copy, from either entry point, opens Flow C at its Source week step (124). Both lead to the same
// step and differ only in what it already knows (04, "Точки входа"): the `+` sheet's row knows
// nothing, a Completed row passes the block it was swiped on as `sourceMesoId`. The step is never
// skipped — it just opens with that block already chosen.
// One destination doesn't exist yet, so it's an explicit "not available yet" popup rather than a
// button that silently does nothing: Completed `⋯` → a mesocycle's History screen.
// Planned `⋯` → Edit opens the same editor on that mesocycle (app/meso-editor/edit/[id].tsx), with
// that mesocycle loaded into the editor draft first.
// The Active card's current week comes from the mesocycle's grid (useMesoGrid, 089) — its sessions,
// not the calendar — so a break of a few days between workouts doesn't move it.
// `+` opens the creation-method sheet (123), which the screen owns; the route only supplies the
// two destinations.

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
      onCreateFromScratch={() => router.push('/meso-editor/new')}
      onCopyMesocycle={() => router.push('/meso-editor/copy')}
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
      onCopy={(mesocycle) =>
        router.push({
          pathname: '/meso-editor/copy',
          params: { sourceMesoId: mesocycle.id },
        })
      }
      onOpenHistory={() => showNotAvailable('Mesocycle history')}
    />
  );
}
