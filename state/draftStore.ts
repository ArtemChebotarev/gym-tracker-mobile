import { create } from 'zustand';

import type { WeekPlanExercise } from '@domain/plan';

// Mesocycle builder draft (introduced by task 075 — see 08.5 · Редактор мезоцикла — Flow A) so
// the fields collected on Basics (step 1) survive navigation to Days & exercises (step 2, task
// 076) and Review (step 3, added by a later task) instead of resetting every time the editor
// route remounts. `name` starts empty (nothing typed yet); `lengthWeeks`/`daysPerWeek` start at
// the mockup's own shown values (01-new-meso-basics.html: 6 weeks, 4 days) since a stepper,
// unlike a text field, has no empty state to start from.
//
// `exercisesByDay` is keyed by day number (1..daysPerWeek) rather than a `WeekPlanDay[]` array
// kept in sync with `daysPerWeek` — a day the user hasn't touched yet simply has no entry (read
// as empty, see MesoEditorDaysStepLogic.ts's `getDayExercises`), so growing or shrinking
// `daysPerWeek` on step 1 never requires padding or truncating this map to match: day 6 either
// has exercises under key 6 or it doesn't, regardless of what `daysPerWeek` said the last time
// this was read.
export type MesoBuilderDraft = {
  name: string;
  lengthWeeks: number;
  daysPerWeek: number;
  exercisesByDay: Record<number, WeekPlanExercise[]>;
};

export const DEFAULT_MESO_BUILDER_DRAFT: MesoBuilderDraft = {
  name: '',
  lengthWeeks: 6,
  daysPerWeek: 4,
  exercisesByDay: {},
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
