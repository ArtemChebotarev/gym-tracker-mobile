import { useRouter } from 'expo-router';

import { MesoEditorBasicsScreen } from '@components/MesoEditorBasicsScreen';
import { useDraftStore } from '@state/draftStore';

export default function MesoEditorBasicsRoute() {
  const router = useRouter();
  const draft = useDraftStore((state) => state.mesoBuilder);
  const setDraft = useDraftStore((state) => state.setMesoBuilder);
  const resetDraft = useDraftStore((state) => state.resetMesoBuilder);

  function handleClose() {
    resetDraft();
    router.back();
  }

  function handleContinue() {
    router.push('/meso-editor/days');
  }

  return (
    <MesoEditorBasicsScreen
      name={draft.name}
      lengthWeeks={draft.lengthWeeks}
      daysPerWeek={draft.daysPerWeek}
      onChangeName={(name) => setDraft({ ...draft, name })}
      onChangeLengthWeeks={(lengthWeeks) => setDraft({ ...draft, lengthWeeks })}
      onChangeDaysPerWeek={(daysPerWeek) => setDraft({ ...draft, daysPerWeek })}
      onClose={handleClose}
      onContinue={handleContinue}
    />
  );
}
