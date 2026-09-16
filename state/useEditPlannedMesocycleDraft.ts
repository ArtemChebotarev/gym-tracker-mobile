// Saves the mesocycle editor's draft over an existing planned mesocycle through the usecase layer
// via TanStack Query — task 072, Planned `⋯` → Edit (08.3 · Мезоциклы — список) followed by
// `Save mesocycle` on the editor's step 3. Invalidates `mesocycles` so the list shows the change.

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { editPlannedMesocycle } from '@usecases/mesocycleEditing';

import { toScratchMesocycleDraftInput, type MesoBuilderDraft } from './draftStore';
import { mesocycleEditingDeps } from './mesocycleStore';

export function useEditPlannedMesocycleDraft(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draft: MesoBuilderDraft) =>
      editPlannedMesocycle(id, toScratchMesocycleDraftInput(draft), mesocycleEditingDeps),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesocycles'] });
    },
  });
}
