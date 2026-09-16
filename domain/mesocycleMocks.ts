// Stub mesocycles — task 074 ("Мезоциклы — список"). Until Start (042) and finishing a mesocycle
// exist, nothing in the app can produce an `active` or `completed` mesocycle, so the list screen
// would only ever show Planned. These three (one per status the list renders) are seeded into the
// app-wide store alongside whatever the user saves through Flow A — see state/mesocycleStore.ts.
// Same role as ./exerciseCatalog.ts: plain data, no side effects, no repository calls.
//
// Dates are relative to `now` so the Active card always lands mid-block (week 2) no matter when
// the app is launched, instead of a hardcoded start date drifting past `lengthWeeks`.

import type { Mesocycle } from './mesocycle';
import { defaultProgressionSettings } from './mesocycle';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBefore(now: Date, days: number): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

/** Stable ids, so seeding twice (or re-seeding after a reload) never duplicates a mock. */
export const MOCK_MESOCYCLE_IDS = {
  active: 'mock-mesocycle-active',
  planned: 'mock-mesocycle-planned',
  completed: 'mock-mesocycle-completed',
} as const;

export function buildMockMesocycles(now: Date): Mesocycle[] {
  return [
    {
      id: MOCK_MESOCYCLE_IDS.active,
      name: 'Upper/Lower',
      lengthWeeks: 5,
      daysPerWeek: 4,
      startDate: daysBefore(now, 10),
      status: 'active',
      origin: { type: 'scratch' },
      progressionSettings: defaultProgressionSettings,
      createdAt: daysBefore(now, 12),
    },
    {
      id: MOCK_MESOCYCLE_IDS.planned,
      name: 'Push/Pull/Legs',
      lengthWeeks: 6,
      daysPerWeek: 3,
      status: 'planned',
      origin: { type: 'scratch' },
      progressionSettings: defaultProgressionSettings,
      weekPlan: {
        days: [
          {
            dayNumber: 1,
            name: '',
            exercises: [
              { exerciseId: 'bench-press-barbell', order: 0, sets: 3 },
              { exerciseId: 'shoulder-press-dumbbell', order: 1, sets: 3 },
            ],
          },
          {
            dayNumber: 2,
            name: '',
            exercises: [
              { exerciseId: 'barbell-row-barbell', order: 0, sets: 3 },
              { exerciseId: 'bicep-curl-dumbbell', order: 1, sets: 2 },
            ],
          },
          {
            dayNumber: 3,
            name: '',
            exercises: [
              { exerciseId: 'squat-barbell', order: 0, sets: 3 },
              { exerciseId: 'leg-press-machine', order: 1, sets: 2 },
            ],
          },
        ],
      },
      createdAt: daysBefore(now, 2),
    },
    {
      id: MOCK_MESOCYCLE_IDS.completed,
      name: 'Strength Base',
      lengthWeeks: 4,
      daysPerWeek: 3,
      startDate: daysBefore(now, 60),
      status: 'completed',
      origin: { type: 'scratch' },
      progressionSettings: defaultProgressionSettings,
      createdAt: daysBefore(now, 62),
      completedAt: daysBefore(now, 32),
    },
  ];
}
