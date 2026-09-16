// Saves the mesocycle editor's draft as a planned mesocycle through the usecase layer via
// TanStack Query — task 078, the `Save mesocycle` button on step 3 (08.5 · Редактор мезоцикла —
// Flow A, "Шаг 3 — Review & confirm"). Calls Confirm (task 071's `confirmScratchMesocycleDraft`),
// which never creates a `Session` — that's Start's job (042). Invalidates the `mesocycles` query
// key on success so the mesocycles list (074) picks the new planned mesocycle up once it exists.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { confirmScratchMesocycleDraft } from '@usecases/mesocycleCreation';

import { toScratchMesocycleDraftInput, type MesoBuilderDraft } from './draftStore';
import { mesocycleCreationDeps } from './mesocycleStore';

export function useConfirmMesocycleDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: MesoBuilderDraft) =>
      confirmScratchMesocycleDraft(toScratchMesocycleDraftInput(draft), mesocycleCreationDeps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
    },
  });
}
