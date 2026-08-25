import { create } from 'zustand';

// Empty for now — draft slices (e.g. the mesocycle builder draft) are added
// by the tasks that introduce them, so drafts survive navigation between screens.
type DraftState = Record<string, never>;

export const useDraftStore = create<DraftState>(() => ({}));
