import { toExerciseId } from '../domain/catalog';
import type { MesoTemplate, WeekPlanDay } from '../domain/plan';
import type { Unsaved } from '../domain/timestamps';

// Throwaway templates for building Flow B (story GT-2) on the simulator, written by
// `npm run dev:seed-templates` (scripts/devSeedTemplates.ts). Not the real catalog templates —
// those ship as a migration in GT-5, once their content is settled. Every id starts with
// `DEV_TEMPLATE_ID_PREFIX` and every name with "Dev · ", so they are easy to tell apart from the
// real ones and to remove with `--clean`.
//
// The set is deliberately uneven — 2 to 6 days, 2 to 7 exercises a day, 2 to 5 sets — so the list,
// the preview and applying a template to a draft all meet more than one shape.

export const DEV_TEMPLATE_ID_PREFIX = 'dev-';

/** One day from `[exerciseId, sets]` pairs, `order` following the array. */
function day(dayNumber: number, name: string, slots: [string, number][]): WeekPlanDay {
  return {
    dayNumber,
    name,
    exercises: slots.map(([id, sets], index) => ({
      exerciseId: toExerciseId(id),
      order: index + 1,
      sets,
    })),
  };
}

function devTemplate(
  id: string,
  name: string,
  defaultLengthWeeks: number,
  days: WeekPlanDay[],
): Unsaved<MesoTemplate> {
  return {
    id: `${DEV_TEMPLATE_ID_PREFIX}${id}`,
    name: `Dev · ${name}`,
    source: 'catalog',
    // GT-5 drops this column; until then the row needs a value.
    defaultLengthWeeks,
    weekPlan: { days },
    isHidden: false,
  };
}

export const DEV_TEMPLATES: readonly Unsaved<MesoTemplate>[] = [
  devTemplate('minimal-2', 'Minimal 2-day', 4, [
    day(1, 'Day A', [
      ['squat-barbell', 3],
      ['bench-press-barbell', 3],
    ]),
    day(2, 'Day B', [
      ['deadlift-barbell', 2],
      ['pull-up-bodyweight', 3],
    ]),
  ]),
  devTemplate('full-body-3', 'Full Body 3-day', 5, [
    day(1, 'Full Body A', [
      ['squat-barbell', 3],
      ['bench-press-barbell', 3],
      ['barbell-row-barbell', 3],
      ['lateral-raise-dumbbell', 2],
      ['bicep-curl-dumbbell', 2],
    ]),
    day(2, 'Full Body B', [
      ['stiff-legged-deadlift-barbell', 3],
      ['shoulder-press-dumbbell', 3],
      ['lat-pulldown-cable', 3],
      ['triceps-pushdown-cable', 2],
      ['standing-calf-raise-machine', 3],
    ]),
    day(3, 'Full Body C', [
      ['leg-press-machine', 3],
      ['incline-bench-press-dumbbell', 3],
      ['seated-row-cable', 3],
      ['hanging-leg-raise-bodyweight', 2],
    ]),
  ]),
  devTemplate('upper-lower-4', 'Upper / Lower 4-day', 6, [
    day(1, 'Upper 1', [
      ['bench-press-barbell', 4],
      ['barbell-row-barbell', 4],
      ['shoulder-press-dumbbell', 3],
      ['lat-pulldown-cable', 3],
      ['triceps-pushdown-cable', 3],
      ['bicep-curl-cable', 3],
    ]),
    day(2, 'Lower 1', [
      ['squat-barbell', 4],
      ['lying-leg-curl-machine', 3],
      ['leg-extension-machine', 3],
      ['standing-calf-raise-machine', 4],
    ]),
    day(3, 'Upper 2', [
      ['incline-bench-press-dumbbell', 4],
      ['pull-up-weighted-bodyweight', 4],
      ['lateral-raise-cable', 4],
      ['face-pull-cable', 3],
      ['hammer-curl-dumbbell', 3],
    ]),
    day(4, 'Lower 2', [
      ['deadlift-barbell', 3],
      ['hack-squat-machine', 3],
      ['seated-leg-curl-machine', 3],
      ['hip-thrust-barbell', 3],
      ['seated-calf-raise-machine', 4],
    ]),
  ]),
  devTemplate('bro-split-5', 'Bro Split 5-day', 5, [
    day(1, 'Chest', [
      ['bench-press-barbell', 4],
      ['incline-bench-press-dumbbell', 4],
      ['chest-press-machine', 3],
      ['cable-fly-cable', 3],
      ['pec-deck-machine', 3],
      ['dips-chest-focused-bodyweight', 2],
      ['push-up-bodyweight', 2],
    ]),
    day(2, 'Back', [
      ['deadlift-barbell', 3],
      ['pull-up-bodyweight', 4],
      ['t-bar-row-other', 4],
      ['lat-pulldown-parallel-grip-cable', 3],
      ['straight-arm-pulldown-cable', 3],
      ['shrug-dumbbell', 3],
    ]),
    day(3, 'Shoulders', [
      ['shoulder-press-barbell', 4],
      ['lateral-raise-dumbbell', 5],
      ['rear-delt-fly-cable', 4],
      ['front-raise-dumbbell', 3],
    ]),
    day(4, 'Legs', [
      ['squat-barbell', 4],
      ['leg-press-machine', 4],
      ['bulgarian-split-squat-dumbbell', 3],
      ['lying-leg-curl-machine', 4],
      ['calf-press-on-leg-press-machine', 4],
    ]),
    day(5, 'Arms', [
      ['close-grip-bench-press-barbell', 3],
      ['bicep-curl-barbell', 3],
      ['skull-crusher-dumbbell', 3],
      ['incline-curl-dumbbell', 3],
      ['triceps-extension-overhead-cable', 3],
      ['preacher-curl-machine', 3],
    ]),
  ]),
  devTemplate('ppl-6', 'Push Pull Legs 6-day', 7, [
    day(1, 'Push 1', [
      ['bench-press-barbell', 3],
      ['shoulder-press-machine', 3],
      ['lateral-raise-cable', 3],
      ['triceps-pushdown-cable', 3],
    ]),
    day(2, 'Pull 1', [
      ['pull-up-bodyweight', 3],
      ['chest-supported-row-machine', 3],
      ['face-pull-cable', 3],
      ['bicep-curl-dumbbell', 3],
    ]),
    day(3, 'Legs 1', [
      ['squat-barbell', 3],
      ['stiff-legged-deadlift-dumbbell', 3],
      ['leg-extension-machine', 3],
      ['standing-calf-raise-machine', 3],
    ]),
    day(4, 'Push 2', [
      ['incline-bench-press-barbell', 3],
      ['shoulder-press-dumbbell', 3],
      ['cable-fly-cable', 3],
      ['triceps-extension-cable', 3],
    ]),
    day(5, 'Pull 2', [
      ['lat-pulldown-cable', 3],
      ['dumbbell-row-dumbbell', 3],
      ['rear-delt-fly-dumbbell', 3],
      ['hammer-curl-dumbbell', 3],
    ]),
    day(6, 'Legs 2', [
      ['front-squat-barbell', 3],
      ['seated-leg-curl-machine', 3],
      ['lunge-dumbbell', 3],
      ['cable-crunch-cable', 3],
    ]),
  ]),
];
