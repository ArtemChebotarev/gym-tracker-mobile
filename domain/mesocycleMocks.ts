// Stub mesocycles — task 074 ("Мезоциклы — список"). Until finishing a mesocycle exists, nothing
// in the app can produce a `completed` one, so the list screen would never show that group. Seeded
// into the app-wide store alongside whatever the user saves through Flow A — see
// state/mesocycleStore.ts. Same role as ./exerciseCatalog.ts: plain data, no side effects, no
// repository calls.
// The Planned one is small on purpose (3 weeks × 2 days, 3 + 1 exercises), so starting it (042) and
// training through it by hand is quick. There is no active stub: an active mesocycle, with its
// sessions, is what Start produces from a planned one.
//
// Dates are relative to `now`, so the Completed card reads as a block finished a month ago no
// matter when the app is launched.

import type { Mesocycle } from './mesocycle';
import { defaultProgressionSettings } from './mesocycle';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBefore(now: Date, days: number): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

/** Stable ids, so seeding twice (or re-seeding after a reload) never duplicates a mock. */
export const MOCK_MESOCYCLE_IDS = {
  planned: 'mock-mesocycle-planned',
  completed: 'mock-mesocycle-completed',
} as const;

export function buildMockMesocycles(now: Date): Mesocycle[] {
  return [
    {
      id: MOCK_MESOCYCLE_IDS.planned,
      name: 'Upper/Lower',
      lengthWeeks: 3,
      daysPerWeek: 2,
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
              { exerciseId: 'barbell-row-barbell', order: 1, sets: 3 },
              { exerciseId: 'shoulder-press-dumbbell', order: 2, sets: 2 },
            ],
          },
          {
            dayNumber: 2,
            name: '',
            exercises: [{ exerciseId: 'squat-barbell', order: 0, sets: 3 }],
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
