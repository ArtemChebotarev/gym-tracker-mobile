// The mesocycle editor, Flow C — copy a week of a finished block (04 · Meso Creation Flows,
// "Flow C"; 08.8 · Редактор мезоцикла — Flow C, task 124). The screen itself lives in
// components/MesoCopyEditorScreen.tsx; this route only reads which block, if any, the entry point
// already knew about.
//
// `sourceMesoId` is optional by design, not a missing case: `+` → `Copy a mesocycle` arrives
// without one and the step resolves its own default, while `Copy` on a Completed row (08.3) and
// the offer after Finish mesocycle pass the block they were pressed on. Step S is shown either
// way — it is never skipped (04, "Точки входа").
import { useLocalSearchParams } from 'expo-router';

import { MesoCopyEditorScreen } from '@components/MesoCopyEditorScreen';

export default function CopyMesocycleRoute() {
  const { sourceMesoId } = useLocalSearchParams<{ sourceMesoId?: string }>();

  return <MesoCopyEditorScreen initialMesoId={sourceMesoId} />;
}
