import { create } from 'zustand';

import type { ExerciseId } from '@domain/catalog';

// The Add/Replace picker's hand-off to an exercise's preview (GT-179). A row in the picker opens
// the Exercise screen over it (exercisePickHref); the screen shows the picker's own confirm button
// under the exercise, and pressing it picks that exercise — adding it, with whatever else is
// checked, or swapping to it. The picker's sheet stays mounted underneath the whole time (it is an
// overlay inside its screen, not a native modal), so Back finds it as it was; what the preview
// needs from it — the button's label and what a pick does — waits here.
//
// One slot: only one picker is open at a time. The screen clears it when it closes, so a stale
// pick never shows a button on a later visit.

export type ExercisePick = {
  /** The confirm button's label, as the picker would word it with this exercise picked. */
  label: string;
  /** Picks the exercise. The caller closes the picker and acts on it. */
  onPick: (exerciseId: ExerciseId) => void;
};

type ExercisePickStore = {
  pick: ExercisePick | null;
  start: (pick: ExercisePick) => void;
  clear: () => void;
};

export const useExercisePickStore = create<ExercisePickStore>((set) => ({
  pick: null,
  start: (pick) => set({ pick }),
  clear: () => set({ pick: null }),
}));
