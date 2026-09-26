// "Мезоцикл (деталь)" (08.9, task 129) — replaces the 098 stub. The `[id]` segment is the
// mesocycle id, and both ways in push it: a Completed row on 08.3, and `Mesocycle history` in the
// workout header's menu (08.7). Back returns to whichever of the two it came from.
//
// Composes the screen with the Rename sheet as a sibling, the way the Today route does. Copy opens
// Flow C at its Source week step with this block already chosen — the same way in as a Completed
// row's `⋯` on 08.3 (124). Archive asks first with the list's own confirmation, then goes back — the
// block has left the list. A closed block's grid cell pushes that day as `session/[id]`, in History
// mode (130); back from it returns here.
import { useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { MesocycleDetailScreen } from '@components/MesocycleDetailScreen';
import { historySessionHref } from '@components/workoutRoutes';
import { mesocycleDetailMenuItems } from '@components/MesocycleDetailScreenLogic';
import { formatArchiveConfirmMessage } from '@components/MesocyclesScreenLogic';
import { RenameMesocycleSheet } from '@components/RenameMesocycleSheet';
import { useArchiveMesocycle } from '@state/useArchiveMesocycle';
import { useMesocycleDetail } from '@state/useMesocycleDetail';
import { useRenameMesocycle } from '@state/useRenameMesocycle';

export default function MesocycleDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useMesocycleDetail(id);
  const renameMesocycle = useRenameMesocycle();
  const archiveMesocycle = useArchiveMesocycle();

  // The Rename sheet and the name being typed into it — prefilled with the current name.
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');

  const mesocycle = query.data?.mesocycle;

  return (
    <>
      <MesocycleDetailScreen
        detail={query.data}
        isPending={query.isPending}
        onBack={() => router.back()}
        onOpenSession={(sessionId) => router.push(historySessionHref(sessionId))}
        menuItems={
          mesocycle
            ? mesocycleDetailMenuItems(mesocycle.status, {
                onRename: () => {
                  setRenameText(mesocycle.name);
                  setIsRenameOpen(true);
                },
                onCopy: () =>
                  router.push({
                    pathname: '/meso-editor/copy',
                    params: { sourceMesoId: mesocycle.id },
                  }),
                onArchive: () =>
                  Alert.alert('Archive mesocycle?', formatArchiveConfirmMessage(mesocycle), [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Archive',
                      onPress: () =>
                        archiveMesocycle.mutate(mesocycle.id, {
                          // The block has left the list this screen stands for — back to where
                          // it was opened from.
                          onSuccess: () => router.back(),
                          onError: () =>
                            Alert.alert(
                              "Couldn't archive mesocycle",
                              'Something went wrong. Please try again.',
                            ),
                        }),
                    },
                  ]),
              })
            : []
        }
      />
      <RenameMesocycleSheet
        visible={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        value={renameText}
        onChangeValue={setRenameText}
        onSave={(name) => {
          setIsRenameOpen(false);
          renameMesocycle.mutate(
            { mesoId: id, name },
            { onError: () => Alert.alert("Couldn't rename the mesocycle", 'Please try again.') },
          );
        }}
        isSaving={renameMesocycle.isPending}
      />
    </>
  );
}
