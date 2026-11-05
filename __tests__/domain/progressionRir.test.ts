import { MAX_START_RIR, rirSchedule, startRir, targetRir, workingWeekCount } from '@domain/progressionRir';

describe('rirSchedule', () => {
  // The breakdown table from 03 · Progression Engine, "Правило 4 — целевой RIR".
  test.each([
    [3, [1, 0]],
    [4, [2, 1, 0]],
    [5, [3, 2, 1, 0]],
    [6, [3, 3, 2, 1, 0]],
    [7, [3, 3, 2, 2, 1, 0]],
    [8, [3, 3, 2, 2, 1, 1, 0]],
  ])('a %i-week block breaks down as %j', (lengthWeeks, expected) => {
    expect(rirSchedule(lengthWeeks)).toEqual(expected);
  });

  test.each([3, 4, 5, 6, 7, 8])(
    'a %i-week block never exceeds the RIR ceiling and ends its working weeks on 0',
    (lengthWeeks) => {
      const schedule = rirSchedule(lengthWeeks);
      expect(Math.max(...schedule)).toBeLessThanOrEqual(MAX_START_RIR);
      expect(schedule.at(-1)).toBe(0);
    },
  );

  test.each([2, 9])('rejects a %i-week block', (lengthWeeks) => {
    expect(() => rirSchedule(lengthWeeks)).toThrow(/lengthWeeks must be between 3 and 8/);
  });
});

describe('startRir', () => {
  test.each([
    [3, 1],
    [4, 2],
    [5, 3],
    [8, 3],
  ])('a %i-week block starts at RIR %i', (lengthWeeks, expected) => {
    expect(startRir(lengthWeeks)).toBe(expected);
  });
});

describe('workingWeekCount', () => {
  test('excludes the trailing deload week', () => {
    expect(workingWeekCount(6)).toBe(5);
  });
});

describe('targetRir', () => {
  test('matches the schedule for an individual week', () => {
    expect(targetRir(6, 3)).toBe(2);
  });

  test.each([0, 6, 7, 1.5])(
    'rejects week %p of a 6-week block (not a working week)',
    (weekNumber) => {
      expect(() => targetRir(6, weekNumber)).toThrow(/Working week must be an integer between 1 and 5/);
    },
  );
});
