// Edit a planned mesocycle — task 072, Planned `⋯` → Edit (08.3 · Мезоциклы — список). Opens the
// same wizard as creation (components/MesoEditorScreen.tsx) and saves through the edit use case
// instead of Confirm. The saved mesocycle is loaded into the draft by the caller right before
// navigating here (app/(tabs)/mesocycles.tsx), so the wizard opens already filled in — no loading
// state of its own. A save on anything but a `planned` mesocycle is rejected by the use case and
// surfaces as the editor's usual try-again alert.
import { useLocalSearchParams } from 'expo-router';

import { MesoEditorScreen } from '@components/MesoEditorScreen';
import { useEditPlannedMesocycleDraft } from '@state/useEditPlannedMesocycleDraft';

export default function EditMesocycleRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const editMesocycleDraft = useEditPlannedMesocycleDraft(id);

  return <MesoEditorScreen title="Edit mesocycle" saveMutation={editMesocycleDraft} />;
}
