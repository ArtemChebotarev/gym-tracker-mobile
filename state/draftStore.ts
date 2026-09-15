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
  // Same dual-mode shape as React's own useState setter: a plain value replaces the draft
  // outright (every existing call site), and an updater function receives the store's *current*
  // draft at the moment it actually runs — not whatever `mesoBuilder` a caller's own closure
  // captured back when that closure was created. MesoEditorDaysStep.tsx's drag-to-reorder needs
  // exactly that: its PanResponder is cached and deliberately not rebuilt on every render (see
  // that file's own comment), so an old cached closure calling this with a plain value could
  // overwrite a newer draft — e.g. a Stepper edit made after the responder was cached, silently
  // reverted by a reorder that follows it. The updater form reads the store's own state at call
  // time instead, so it's correct no matter how stale the closure that invoked it is.
  setMesoBuilder: (draft: MesoBuilderDraft | ((current: MesoBuilderDraft) => MesoBuilderDraft)) => void;
  resetMesoBuilder: () => void;
};

export const useDraftStore = create<DraftState>((set) => ({
  mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT,
  setMesoBuilder: (draft) =>
    set((state) => ({ mesoBuilder: typeof draft === 'function' ? draft(state.mesoBuilder) : draft })),
  resetMesoBuilder: () => set({ mesoBuilder: DEFAULT_MESO_BUILDER_DRAFT }),
}));
