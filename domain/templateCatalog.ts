// The mesocycle templates that ship with the app — see 02 · Domain Model ("MesoTemplate") and
// the story "Start cycle from template" (GT-2). A plain TS array like `exerciseCatalog.ts`, for
// the same reasons: ids are hand-picked slugs baked into the app, and every `exerciseId` is
// checked against the exercise catalog by a test rather than trusted.
//
// This is what `npm run catalog:migration` writes into a migration, next to the exercises. Two
// things follow from that, and both are the reason the file changes rarely:
//
// - A template that has reached a phone is there for good. The migration is an upsert, so it
//   corrects a template that exists and adds a new one, but never removes one — a catalog
//   template can only be hidden by the user. A template that is wrong is corrected by a newer
//   migration, not withdrawn.
// - Every edit here needs a new migration (the test "is exactly the catalog this build ships"
//   fails until there is one), so a template goes in once it is settled, not as a draft.
//
// Names carry no number of days: the list appends it itself, from `weekPlan` ("Full Body · 3 days").
// Day names are `Day N` only.
import type { MesoTemplate } from './plan';
import type { Unsaved } from './timestamps';

export const TEMPLATE_CATALOG: readonly Unsaved<MesoTemplate>[] = [
  {
    id: 'upper-lower',
    name: 'Upper / Lower',
    description: 'Upper and lower body on alternating days',
    source: 'catalog',
    isHidden: false,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: 'Day 1',
          exercises: [
            { exerciseId: 'lateral-raise-dumbbell', order: 1, sets: 3 },
            { exerciseId: 'dips-chest-focused-weighted-bodyweight', order: 2, sets: 2 },
            { exerciseId: 'pec-deck-machine', order: 3, sets: 2 },
            { exerciseId: 'pull-up-bodyweight', order: 4, sets: 2 },
            { exerciseId: 'seated-row-cable', order: 5, sets: 2 },
            { exerciseId: 'bicep-curl-alternating-dumbbell', order: 6, sets: 3 },
            { exerciseId: 'triceps-pushdown-single-arm-cable', order: 7, sets: 2 },
          ],
        },
        {
          dayNumber: 2,
          name: 'Day 2',
          exercises: [
            { exerciseId: 'leg-extension-machine', order: 1, sets: 2 },
            { exerciseId: 'trap-bar-deadlift-barbell', order: 2, sets: 2 },
            { exerciseId: 'front-squat-kettlebell-other', order: 3, sets: 2 },
            { exerciseId: 'lying-leg-curl-machine', order: 4, sets: 2 },
            { exerciseId: 'standing-calf-raise-machine', order: 5, sets: 2 },
          ],
        },
        {
          dayNumber: 3,
          name: 'Day 3',
          exercises: [
            { exerciseId: 'lateral-raise-dumbbell', order: 1, sets: 3 },
            { exerciseId: 'face-pull-cable', order: 2, sets: 3 },
            { exerciseId: 'bicep-curl-cable', order: 3, sets: 3 },
            { exerciseId: 'bicep-curl-barbell', order: 4, sets: 3 },
            { exerciseId: 'barbell-row-barbell', order: 5, sets: 2 },
            { exerciseId: 'incline-bench-press-dumbbell', order: 6, sets: 2 },
            { exerciseId: 'skull-crusher-dumbbell', order: 7, sets: 1 },
            { exerciseId: 'triceps-pushdown-single-arm-cable', order: 8, sets: 1 },
          ],
        },
        {
          dayNumber: 4,
          name: 'Day 4',
          exercises: [
            { exerciseId: 'seated-leg-curl-machine', order: 1, sets: 2 },
            { exerciseId: 'front-squat-barbell', order: 2, sets: 2 },
            { exerciseId: 'sissy-squat-bodyweight', order: 3, sets: 2 },
            { exerciseId: 'stiff-legged-deadlift-barbell', order: 4, sets: 2 },
            { exerciseId: 'seated-calf-raise-machine', order: 5, sets: 2 },
          ],
        },
      ],
    },
  },
  {
    id: 'push-pull-legs',
    name: 'Push / Pull / Legs',
    source: 'catalog',
    isHidden: false,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: 'Day 1',
          exercises: [
            { exerciseId: 'incline-bench-press-dumbbell', order: 1, sets: 2 },
            { exerciseId: 'cable-fly-cable', order: 2, sets: 2 },
            { exerciseId: 'lateral-raise-dumbbell', order: 3, sets: 2 },
            { exerciseId: 'triceps-extension-overhead-cable', order: 4, sets: 2 },
            { exerciseId: 'triceps-pushdown-cable', order: 5, sets: 2 },
          ],
        },
        {
          dayNumber: 2,
          name: 'Day 2',
          exercises: [
            { exerciseId: 'lat-pulldown-cable', order: 1, sets: 2 },
            { exerciseId: 'seated-row-cable', order: 2, sets: 2 },
            { exerciseId: 'rear-delt-fly-cable', order: 3, sets: 3 },
            { exerciseId: 'bicep-curl-alternating-dumbbell', order: 4, sets: 2 },
            { exerciseId: 'hammer-curl-dumbbell', order: 5, sets: 2 },
            { exerciseId: 'wrist-curl-dumbbell', order: 6, sets: 3 },
          ],
        },
        {
          dayNumber: 3,
          name: 'Day 3',
          exercises: [
            { exerciseId: 'smith-incline-bench-press-machine', order: 1, sets: 2 },
            { exerciseId: 'cable-fly-cable', order: 2, sets: 2 },
            { exerciseId: 'lateral-raise-dumbbell', order: 3, sets: 2 },
            { exerciseId: 'triceps-pushdown-single-arm-cable', order: 4, sets: 2 },
            { exerciseId: 'close-grip-bench-press-barbell', order: 5, sets: 2 },
          ],
        },
        {
          dayNumber: 4,
          name: 'Day 4',
          exercises: [
            { exerciseId: 'lat-pulldown-single-arm-cable', order: 1, sets: 2 },
            { exerciseId: 'seated-row-cable', order: 2, sets: 2 },
            { exerciseId: 'rear-delt-fly-cable', order: 3, sets: 3 },
            { exerciseId: 'bicep-curl-alternating-dumbbell', order: 4, sets: 2 },
            { exerciseId: 'hammer-curl-dumbbell', order: 5, sets: 2 },
            { exerciseId: 'wrist-curl-dumbbell', order: 6, sets: 3 },
          ],
        },
        {
          dayNumber: 5,
          name: 'Day 5',
          exercises: [
            { exerciseId: 'smith-squat-machine', order: 1, sets: 2 },
            { exerciseId: 'leg-extension-machine', order: 2, sets: 2 },
            { exerciseId: 'lying-leg-curl-machine', order: 3, sets: 2 },
            { exerciseId: 'standing-calf-raise-machine', order: 4, sets: 3 },
            { exerciseId: 'hip-adduction-machine', order: 5, sets: 2 },
          ],
        },
      ],
    },
  },
  {
    id: 'full-body-starter',
    name: 'Full Body Starter',
    description: 'Two easy full-body days, mostly bodyweight',
    source: 'catalog',
    isHidden: false,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: 'Day 1',
          exercises: [
            { exerciseId: 'lat-pulldown-cable', order: 1, sets: 3 },
            { exerciseId: 'chest-press-machine', order: 2, sets: 3 },
            { exerciseId: 'lateral-raise-dumbbell', order: 3, sets: 2 },
            { exerciseId: 'bicep-curl-dumbbell', order: 4, sets: 2 },
            { exerciseId: 'triceps-pushdown-cable', order: 5, sets: 2 },
            { exerciseId: 'squat-bodyweight', order: 6, sets: 2 },
            { exerciseId: 'reverse-lunge-bodyweight', order: 7, sets: 2 },
          ],
        },
        {
          dayNumber: 2,
          name: 'Day 2',
          exercises: [
            { exerciseId: 'goblet-squat-dumbbell', order: 1, sets: 3 },
            { exerciseId: 'reverse-lunge-bodyweight', order: 2, sets: 3 },
            { exerciseId: 'calf-raise-bodyweight', order: 3, sets: 3 },
            { exerciseId: 'push-up-bodyweight', order: 4, sets: 2 },
            { exerciseId: 'lat-pulldown-parallel-grip-cable', order: 5, sets: 2 },
            { exerciseId: 'lateral-raise-cable', order: 6, sets: 2 },
            { exerciseId: 'bicep-curl-cable', order: 7, sets: 2 },
          ],
        },
      ],
    },
  },
  {
    id: 'full-body-lower-focus',
    name: 'Full Body Lower Focus',
    source: 'catalog',
    isHidden: false,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: 'Day 1',
          exercises: [
            { exerciseId: 'stiff-legged-deadlift-dumbbell', order: 1, sets: 3 },
            { exerciseId: 'goblet-squat-dumbbell', order: 2, sets: 3 },
            { exerciseId: 'reverse-lunge-dumbbell', order: 3, sets: 3 },
            { exerciseId: 'seated-row-cable', order: 4, sets: 2 },
            { exerciseId: 'shoulder-press-machine', order: 5, sets: 2 },
            { exerciseId: 'lateral-raise-dumbbell', order: 6, sets: 2 },
          ],
        },
        {
          dayNumber: 2,
          name: 'Day 2',
          exercises: [
            { exerciseId: 'lat-pulldown-cable', order: 1, sets: 3 },
            { exerciseId: 'push-up-bodyweight', order: 2, sets: 3 },
            { exerciseId: 'rear-delt-fly-machine', order: 3, sets: 3 },
            { exerciseId: 'bulgarian-split-squat-dumbbell', order: 4, sets: 2 },
            { exerciseId: 'single-leg-rdl-dumbbell', order: 5, sets: 2 },
            { exerciseId: 'glute-bridge-bodyweight', order: 6, sets: 2 },
          ],
        },
      ],
    },
  },
  {
    id: 'upper-lower-boxing-hybrid',
    name: 'Upper / Lower + Boxing Hybrid',
    description: 'Upper and lower days, with power, boxing and a cooldown on the lower ones',
    source: 'catalog',
    isHidden: false,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: 'Day 1',
          exercises: [
            { exerciseId: 'lateral-raise-dumbbell', order: 1, sets: 3 },
            { exerciseId: 'dips-chest-focused-weighted-bodyweight', order: 2, sets: 2 },
            { exerciseId: 'pec-deck-machine', order: 3, sets: 2 },
            { exerciseId: 'pull-up-bodyweight', order: 4, sets: 2 },
            { exerciseId: 'seated-row-cable', order: 5, sets: 2 },
            { exerciseId: 'bicep-curl-alternating-dumbbell', order: 6, sets: 3 },
            { exerciseId: 'triceps-pushdown-single-arm-cable', order: 7, sets: 2 },
          ],
        },
        {
          dayNumber: 2,
          name: 'Day 2',
          exercises: [
            { exerciseId: 'leg-extension-machine', order: 1, sets: 2 },
            { exerciseId: 'trap-bar-deadlift-barbell', order: 2, sets: 2 },
            { exerciseId: 'front-squat-kettlebell-other', order: 3, sets: 2 },
            { exerciseId: 'medball-straight-punch-throw', order: 4, sets: 2 },
            { exerciseId: 'medball-hook-throw', order: 5, sets: 2 },
            { exerciseId: 'heavy-bag', order: 6, sets: 3 },
            { exerciseId: 'cooldown', order: 7, sets: 1 },
          ],
        },
        {
          dayNumber: 3,
          name: 'Day 3',
          exercises: [
            { exerciseId: 'lateral-raise-dumbbell', order: 1, sets: 3 },
            { exerciseId: 'face-pull-cable', order: 2, sets: 3 },
            { exerciseId: 'bicep-curl-cable', order: 3, sets: 3 },
            { exerciseId: 'bicep-curl-barbell', order: 4, sets: 3 },
            { exerciseId: 'barbell-row-barbell', order: 5, sets: 2 },
            { exerciseId: 'incline-bench-press-dumbbell', order: 6, sets: 2 },
            { exerciseId: 'skull-crusher-dumbbell', order: 7, sets: 1 },
            { exerciseId: 'triceps-pushdown-single-arm-cable', order: 8, sets: 1 },
          ],
        },
        {
          dayNumber: 4,
          name: 'Day 4',
          exercises: [
            { exerciseId: 'seated-leg-curl-machine', order: 1, sets: 2 },
            { exerciseId: 'stiff-legged-deadlift-barbell', order: 2, sets: 2 },
            { exerciseId: 'bulgarian-split-squat-dumbbell', order: 3, sets: 2 },
            { exerciseId: 'kettlebell-single-arm-push-press', order: 4, sets: 2 },
            { exerciseId: 'box-jump', order: 5, sets: 2 },
            { exerciseId: 'band-punches', order: 6, sets: 6 },
            { exerciseId: 'cooldown', order: 7, sets: 1 },
          ],
        },
      ],
    },
  },
  {
    id: 'hybrid-home-workout',
    name: 'Hybrid Home Workout',
    description: 'Dumbbells, a band and a rope at home: strength, skills and light movement days',
    source: 'catalog',
    isHidden: false,
    weekPlan: {
      days: [
        {
          dayNumber: 1,
          name: 'Day 1',
          exercises: [
            { exerciseId: 'bench-press-dumbbell', order: 1, sets: 3 },
            { exerciseId: 'dumbbell-row-dumbbell', order: 2, sets: 3 },
            { exerciseId: 'push-up-bodyweight', order: 3, sets: 3 },
            { exerciseId: 'shoulder-press-dumbbell', order: 4, sets: 3 },
            { exerciseId: 'lat-pulldown-resistance-band', order: 5, sets: 3 },
            { exerciseId: 'lateral-raise-dumbbell', order: 6, sets: 2 },
            { exerciseId: 'bicep-curl-dumbbell', order: 7, sets: 2 },
            { exerciseId: 'triceps-extension-overhead-dumbbell', order: 8, sets: 2 },
          ],
        },
        {
          dayNumber: 2,
          name: 'Day 2',
          exercises: [
            { exerciseId: 'jump-rope', order: 1, sets: 1 },
            { exerciseId: 'reflex-ball', order: 2, sets: 1 },
            { exerciseId: 'mobility', order: 3, sets: 1 },
          ],
        },
        {
          dayNumber: 3,
          name: 'Day 3',
          exercises: [
            { exerciseId: 'goblet-squat-dumbbell', order: 1, sets: 3 },
            { exerciseId: 'stiff-legged-deadlift-dumbbell', order: 2, sets: 3 },
            { exerciseId: 'bulgarian-split-squat-dumbbell', order: 3, sets: 2 },
            { exerciseId: 'reverse-crunch-bodyweight', order: 4, sets: 3 },
            { exerciseId: 'crunch-weighted-bodyweight', order: 5, sets: 3 },
            { exerciseId: 'side-plank', order: 6, sets: 4 },
            { exerciseId: 'dead-bug-bodyweight', order: 7, sets: 2 },
          ],
        },
        {
          dayNumber: 4,
          name: 'Day 4',
          exercises: [
            { exerciseId: 'wall-handstand', order: 1, sets: 1 },
            { exerciseId: 'bear-crawl', order: 2, sets: 3 },
            { exerciseId: 'bird-dog-bodyweight', order: 3, sets: 2 },
          ],
        },
        {
          dayNumber: 5,
          name: 'Day 5',
          exercises: [
            { exerciseId: 'push-up-bodyweight', order: 1, sets: 3 },
            { exerciseId: 'bent-over-row-dumbbell', order: 2, sets: 3 },
            { exerciseId: 'bulgarian-split-squat-dumbbell', order: 3, sets: 3 },
            { exerciseId: 'stiff-legged-deadlift-dumbbell', order: 4, sets: 2 },
            { exerciseId: 'lateral-raise-dumbbell', order: 5, sets: 2 },
            { exerciseId: 'hammer-curl-dumbbell', order: 6, sets: 2 },
            { exerciseId: 'dead-bug-bodyweight', order: 7, sets: 3 },
          ],
        },
      ],
    },
  },
];
