import { create } from 'zustand';

import type { Mesocycle } from '@domain/mesocycle';
import type {
  ScratchMesocycleDraftInput,
  TemplateMesocycleDraftInput,
} from '@domain/mesocycleBuilders';
import type { WeekPlan, WeekPlanExercise } from '@domain/plan';
import type { TemplateDraft } from '@domain/templateConverters';
import type { CopyWeekMesocycleConfirmInput } from '@usecases/mesocycleCreation';

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
//
// `source` is set only by Flow C (124): it records which week of which block the draft was
// copied from, so step 3's Save can record it as the mesocycle's `origin` (04, "Flow C"). It
// rides on the draft rather than on the copy route's own state because Save reads the draft and
// nothing else — see `toCopyWeekMesocycleConfirmInput`. `templateId` is Flow B's counterpart
// (GT-9), there for the same reason: Save records it as `origin: template`.
export type MesoBuilderDraft = {
  name: string;
  lengthWeeks: number;
  daysPerWeek: number;
  exercisesByDay: Record<number, WeekPlanExercise[]>;
  /** Flow C only — absent in Flow A and when editing a planned mesocycle. */
  source?: { mesoId: string; weekNumber: number };
  /** Flow B only — the template the draft was filled from. */
  templateId?: string;
};

export const DEFAULT_MESO_BUILDER_DRAFT: MesoBuilderDraft = {
  name: '',
  lengthWeeks: 6,
  daysPerWeek: 4,
  exercisesByDay: {},
};

/**
 * Converts the editor's draft into the input Confirm (task 071's `confirmScratchMesocycleDraft`)
 * takes. Builds exactly one `WeekPlanDay` per day 1..`daysPerWeek`: a day with no entry becomes
 * an empty day, and entries for days beyond `daysPerWeek` (left behind after lowering it on step
 * 1 — see the `exercisesByDay` note above) are dropped rather than saved. Days have no names in
 * Flow A (08.5, "Шаг 2", open question on day names), so `name` is always empty — the same
 * convention `extractWeekPlan` uses for a session with no name.
 */
export function toScratchMesocycleDraftInput(draft: MesoBuilderDraft): ScratchMesocycleDraftInput {
  return {
    name: draft.name,
    lengthWeeks: draft.lengthWeeks,
    daysPerWeek: draft.daysPerWeek,
    weekPlan: {
      days: Array.from({ length: draft.daysPerWeek }, (_, index) => ({
        dayNumber: index + 1,
        name: '',
        exercises: draft.exercisesByDay[index + 1] ?? [],
      })),
    },
  };
}

/**
 * Flow C's counterpart of `toScratchMesocycleDraftInput` — what step 3's Save passes to
 * `confirmCopyWeekMesocycleDraft` (041) so the new block records where it came from. Same week
 * plan as Flow A's, plus the source: `origin` is the only thing that differs between a Flow A
 * save and a Flow C one (04, "Сохранение при подтверждении").
 *
 * Throws on a draft with no `source` — that draft belongs in Flow A's save, and quietly filing it
 * as a copy of nothing would give Start history to read that was never chosen.
 */
export function toCopyWeekMesocycleConfirmInput(
  draft: MesoBuilderDraft,
): CopyWeekMesocycleConfirmInput {
  if (draft.source === undefined) {
    throw new Error('Flow C save ran on a draft with no source week.');
  }
  return {
    ...toScratchMesocycleDraftInput(draft),
    sourceMesoId: draft.source.mesoId,
    sourceWeekNumber: draft.source.weekNumber,
  };
}

/**
 * Flow B's counterpart of `toCopyWeekMesocycleConfirmInput` — what step 3's Save passes to
 * `confirmTemplateMesocycleDraft` (GT-9). Same week plan as Flow A's, plus the template, recorded
 * as the mesocycle's `origin`.
 *
 * Throws on a draft with no `templateId` — that draft belongs in Flow A's save.
 */
export function toTemplateMesocycleConfirmInput(
  draft: MesoBuilderDraft,
): TemplateMesocycleDraftInput {
  if (draft.templateId === undefined) {
    throw new Error('Flow B save ran on a draft with no template.');
  }
  return { ...toScratchMesocycleDraftInput(draft), templateId: draft.templateId };
}

/**
 * A `WeekPlan`'s days keyed by day number, the shape `exercisesByDay` wants. Shared by the three
 * ways a draft arrives already filled in — editing a planned mesocycle, copying a week and
 * applying a template — because all three read the same plan out of the same field.
 */
function toExercisesByDay(weekPlan: WeekPlan | undefined): Record<number, WeekPlanExercise[]> {
  const exercisesByDay: Record<number, WeekPlanExercise[]> = {};
  for (const day of weekPlan?.days ?? []) {
    exercisesByDay[day.dayNumber] = day.exercises;
  }
  return exercisesByDay;
}

/**
 * The reverse of `toScratchMesocycleDraftInput`: loads a saved planned mesocycle into the editor's
 * draft shape for Edit (task 072). Days are keyed by their `dayNumber`; a mesocycle without a
 * `weekPlan` (never the case for `planned`, but the field is optional on the type) loads with no
 * exercises.
 */
export function toMesoBuilderDraft(mesocycle: Mesocycle): MesoBuilderDraft {
  return {
    name: mesocycle.name,
    lengthWeeks: mesocycle.lengthWeeks,
    daysPerWeek: mesocycle.daysPerWeek,
    exercisesByDay: toExercisesByDay(mesocycle.weekPlan),
  };
}

/**
 * Flow C's prefilled draft — step S hands this to the editor once a source week is chosen
 * (08.8, "Шаг 1 — Basics" and "Шаг 2 — Days & exercises"). Length and days per week come from the
 * source block, the days and exercises from `weekPlan` — the week as it actually ended, extracted
 * by `extractSourceWeekPlan`, replacements and reordering included.
 *
 * The name is the source's with ` 2` after it, and is editable like any other field. It is
 * deliberately not cleverer than that: a source already ending in a digit gives `Push/Pull 2 2`
 * (08.8's own open question), which reads oddly for a moment and is fixed by typing, whereas
 * guessing at the user's numbering would be wrong in ways that are harder to notice.
 *
 * Every number about load is absent, as it is in Flow A: week 1's reps and weights are computed
 * at Start from each exercise's history, never copied from the source week (04, "Расчёт
 * startReps"; task 122).
 */
export function toCopiedMesoBuilderDraft(
  source: Pick<Mesocycle, 'id' | 'name' | 'lengthWeeks' | 'daysPerWeek'>,
  weekPlan: WeekPlan,
  weekNumber: number,
): MesoBuilderDraft {
  return {
    name: `${source.name} 2`,
    lengthWeeks: source.lengthWeeks,
    daysPerWeek: source.daysPerWeek,
    exercisesByDay: toExercisesByDay(weekPlan),
    source: { mesoId: source.id, weekNumber },
  };
}

/**
 * Flow B's prefilled draft — `Use this template` hands this to the editor (04 · Meso Creation
 * Flows, "Flow B", step 2). Name, days per week and the week itself come from `applyTemplate`;
 * the length is Flow A's default, because a template has none.
 */
export function toTemplateMesoBuilderDraft(template: TemplateDraft): MesoBuilderDraft {
  return {
    name: template.name,
    lengthWeeks: DEFAULT_MESO_BUILDER_DRAFT.lengthWeeks,
    daysPerWeek: template.daysPerWeek,
    exercisesByDay: toExercisesByDay(template.weekPlan),
    templateId: template.templateId,
  };
}

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
