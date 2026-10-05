// Flow B's `Use this template` (08.10, "Лист превью шаблона"; GT-6): applies the template to a new
// editor draft through `prepareTemplateDraft` (GT-9) and resolves with the draft, in the editor's
// own shape. A mutation rather than a query: it runs once, on a tap, and what it reads — the
// existing cycles' names — has to be as of that tap, not of whenever a cache was last filled.
//
// Writing the draft into the store is the caller's, so the wizard decides when it moves on.

import { useMutation } from '@tanstack/react-query';

import { prepareTemplateDraft } from '@usecases/mesocycleCreation';

import { toTemplateMesoBuilderDraft } from './draftStore';
import { useTemplateDraftDeps } from './mesocycleStore';

export function useApplyTemplate() {
  const deps = useTemplateDraftDeps();

  return useMutation({
    meta: { operation: 'applyTemplate' },
    mutationFn: async (templateId: string) =>
      toTemplateMesoBuilderDraft(await prepareTemplateDraft(templateId, deps)),
  });
}
