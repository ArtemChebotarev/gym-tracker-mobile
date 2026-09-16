// The mesocycle editor, Flow A — from scratch (04 · Meso Creation Flows, "Flow A"; see
// 08.5 · Редактор мезоцикла — Flow A for all three steps). The wizard itself lives in
// components/MesoEditorScreen.tsx, shared with editing a planned mesocycle
// (app/meso-editor/edit/[id].tsx); this route only plugs in Confirm (071) as its save.
import { MesoEditorScreen } from '@components/MesoEditorScreen';
import { useConfirmMesocycleDraft } from '@state/useConfirmMesocycleDraft';

export default function MesoEditorRoute() {
  const confirmMesocycleDraft = useConfirmMesocycleDraft();

  return <MesoEditorScreen title="New mesocycle" saveMutation={confirmMesocycleDraft} />;
}
