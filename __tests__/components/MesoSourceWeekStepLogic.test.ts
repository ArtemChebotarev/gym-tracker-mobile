import type { Mesocycle } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import {
  formatWeekWorkouts,
  sourceWeekKey,
  SOURCE_WEEK_HINT,
  toMesocycleOptions,
  toWeekOptions,
} from '@components/MesoSourceWeekStepLogic';
import { STAMPS } from '../fixtures/stamps';

function mesocycle(id: string, name: string): Mesocycle {
  return {
    ...STAMPS,
    id,
    name,
    lengthWeeks: 6,
    daysPerWeek: 3,
    status: 'completed',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
  };
}

describe('toMesocycleOptions', () => {
  test('keeps the order it is given — the caller has already sorted them', () => {
    expect(
      toMesocycleOptions([mesocycle('meso-2', 'Upper/Lower'), mesocycle('meso-1', 'Push/Pull')]),
    ).toEqual([
      { value: 'meso-2', label: 'Upper/Lower' },
      { value: 'meso-1', label: 'Push/Pull' },
    ]);
  });
});

describe('toWeekOptions', () => {
  test('puts the week and its workouts on the one line a dropdown row has', () => {
    expect(toWeekOptions([{ weekNumber: 3, completedCount: 2, sessionCount: 4 }])).toEqual([
      { value: '3', label: 'Week 3 · 2 of 4 workouts' },
    ]);
  });

  // DoD: a week with nothing trained is offered like any other, and says so rather than hiding it.
  test('offers an untrained week and shows it as 0 of N', () => {
    expect(toWeekOptions([{ weekNumber: 4, completedCount: 0, sessionCount: 3 }])).toEqual([
      { value: '4', label: 'Week 4 · 0 of 3 workouts' },
    ]);
  });
});

describe('formatWeekWorkouts', () => {
  test('is singular for a one-day week', () => {
    expect(formatWeekWorkouts({ weekNumber: 1, completedCount: 1, sessionCount: 1 })).toBe(
      '1 of 1 workout',
    );
  });
});

describe('SOURCE_WEEK_HINT', () => {
  // DoD: the deload week can't be picked, and the screen says why. It is not a disabled row any
  // more, so this line is the whole of the explanation — it has to mention deload.
  test('explains the missing deload weeks', () => {
    expect(SOURCE_WEEK_HINT).toMatch(/deload/);
  });
});

describe('sourceWeekKey', () => {
  test('separates one selection from another', () => {
    expect(sourceWeekKey('meso-1', 3)).toBe(sourceWeekKey('meso-1', 3));
    expect(sourceWeekKey('meso-1', 3)).not.toBe(sourceWeekKey('meso-1', 4));
    expect(sourceWeekKey('meso-1', 3)).not.toBe(sourceWeekKey('meso-2', 3));
  });
});
