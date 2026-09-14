import { create } from 'zustand';

// Mesocycle builder draft (introduced by task 075 — see 08.5 · Редактор мезоцикла — Flow A) so
// the fields collected on Basics (step 1) survive navigation to Days & exercises and Review
// (steps 2 and 3, added by later tasks) instead of resetting every time the editor route
// remounts. `name` starts empty (nothing typed yet); `lengthWeeks`/`daysPerWeek` start at the
// mockup's own shown values (01-new-meso-basics.html: 6 weeks, 4 days) since a stepper, unlike a
// text field, has no empty state to start from.
export type MesoBuilderDraft = {
  name: string;
  lengthWeeks: number;
  daysPerWeek: number;
};

export const DEFAULT_MESO_BUILDER_DRAFT: MesoBuilderDraft = {
  name: '',
  lengthWeeks: 6,
  daysPerWeek: 4,
};

type DraftState = {
  mesoBuilder: MesoBuilderDraft;
  setMesoBuilder: (draft: MesoBuilderDraft) => void;
  resetMesoBuilder: () => void;
};

export const useDraftStore = create<DraftState>((set) => ({
  mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT,
  setMesoBuilder: (draft) => set({ mesoBuilder: draft }),
  resetMesoBuilder: () => set({ mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT }),
}));
