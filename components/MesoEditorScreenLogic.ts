import type { MesoBuilderDraft } from '@state/draftStore';

/**
 * Whether closing the wizard would throw something away (GT-52, 08.11 / 08.5): a name typed,
 * exercises added, a template applied or a week copied. The steppers don't count — a cycle length
 * nudged and nothing else isn't worth a question — so a fresh wizard, and Flow B's template list
 * before anything is chosen, close at once. The draft is the only copy (nothing about a new cycle
 * is stored before Save), which is why this asks.
 */
export function hasUnsavedDraft(draft: MesoBuilderDraft): boolean {
  return (
    draft.name.trim() !== '' ||
    draft.templateId !== undefined ||
    draft.source !== undefined ||
    Object.values(draft.exercisesByDay).some((exercises) => exercises.length > 0)
  );
}

/** The confirmation raised by ✕ (and Android's back) when `hasUnsavedDraft`: a question and two buttons. */
export const DISCARD_DRAFT_TITLE = 'Discard training cycle?';
export const DISCARD_DRAFT_MESSAGE = "What you've entered won't be saved.";
export const KEEP_EDITING_LABEL = 'Keep editing';
export const DISCARD_LABEL = 'Discard';
