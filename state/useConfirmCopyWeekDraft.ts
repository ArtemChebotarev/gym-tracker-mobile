// Saves Flow C's draft as a planned mesocycle — task 124's half of step 3's `Save mesocycle`
// (08.8 · Редактор мезоцикла — Flow C, "Шаг 3 — Review & confirm": it "не отличается от Flow A
// ничем"). The sibling of useConfirmMesocycleDraft, and deliberately a separate hook rather than
// a flag on it: the two save through different use cases (`confirmCopyWeekMesocycleDraft` vs
// `confirmScratchMesocycleDraft`) and the editor takes whichever one its route hands it.
//
// What the save records that Flow A's doesn't is `origin: copyWeek` with the source week — the
// mesocycle's own note that Start should price week 1 from history rather than leave it bare
// (04 · Meso Creation Flows, "Расчёт startReps", task 122). No session is created here either;
// that stays Start's job (042).

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { confirmCopyWeekMesocycleDraft } from '@usecases/mesocycleCreation';

import { toCopyWeekMesocycleConfirmInput, type MesoBuilderDraft } from './draftStore';
import { useMesocycleCreationDeps } from './mesocycleStore';

export function useConfirmCopyWeekDraft() {
  const queryClient = useQueryClient();
  const deps = useMesocycleCreationDeps();

  return useMutation({
    mutationFn: async (draft: MesoBuilderDraft) =>
      confirmCopyWeekMesocycleDraft(toCopyWeekMesocycleConfirmInput(draft), deps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
    },
  });
}
