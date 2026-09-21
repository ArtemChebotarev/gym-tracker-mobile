// Stub mesocycles — task 074 ("Мезоциклы — список"): a planned one and a completed one, enough
// for the list screen to show both groups before the app can produce either by itself.
//
// A test fixture, and only that (task 112). They used to be seeded into the store at startup,
// which was harmless while the store was a Map and stopped being harmless the moment it became a
// file: the mocks would settle into the user's database and be indistinguishable from mesocycles
// they had built themselves. A clean install now starts with no mesocycles at all — the empty
// state is the real first screen, and these are what a test writes when it needs one.
// The Planned one is small on purpose (3 weeks × 2 days, 3 + 1 exercises), so starting it (042) and
// training through it by hand is quick. There is no active stub: an active mesocycle, with its
// sessions, is what Start produces from a planned one.
//
// Dates are relative to `now`, so the Completed card reads as a block finished a month ago no
// matter when the app is launched.

import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { Unsaved } from '@domain/timestamps';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBefore(now: Date, days: number): string {
  return new Date(now.getTime() - days * DAY_MS).toISOString();
}

/** Stable ids, so a test can name the mesocycle it seeded without reading it back. */
export const MOCK_MESOCYCLE_IDS = {
  planned: 'mock-mesocycle-planned',
  completed: 'mock-mesocycle-completed',
} as const;

export function buildMockMesocycles(now: Date): Unsaved<Mesocycle>[] {
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
      completedAt: daysBefore(now, 32),
    },
  ];
}
