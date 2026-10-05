// Saves Flow B's draft as a planned mesocycle — GT-6's half of step 3's `Save cycle` (08.10, "Шаг
// 3 — Review & confirm": it "не отличается от Flow A"). The sibling of useConfirmMesocycleDraft and
// useConfirmCopyWeekDraft, and a separate hook for the same reason as the latter: the save goes
// through its own use case (`confirmTemplateMesocycleDraft`), which records `origin: template`.
// No session is created here; that stays Start's job (042).

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { confirmTemplateMesocycleDraft } from '@usecases/mesocycleCreation';

import { toTemplateMesocycleConfirmInput, type MesoBuilderDraft } from './draftStore';
import { useMesocycleCreationDeps } from './mesocycleStore';

export function useConfirmTemplateDraft() {
  const queryClient = useQueryClient();
  const deps = useMesocycleCreationDeps();

  return useMutation({
    meta: { operation: 'confirmTemplateDraft' },
    mutationFn: async (draft: MesoBuilderDraft) =>
      confirmTemplateMesocycleDraft(toTemplateMesocycleConfirmInput(draft), deps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
    },
  });
}
