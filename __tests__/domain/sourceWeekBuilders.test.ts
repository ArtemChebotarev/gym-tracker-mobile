import type { Session } from '@domain/execution';
import { buildSourceWeekOptions, defaultSourceWeekNumber } from '@domain/sourceWeekBuilders';

const SOURCE = { id: 'meso-source', lengthWeeks: 6 };

function session(
  weekNumber: number,
  dayNumber: number,
  status: Session['status'],
  mesoId = SOURCE.id,
): Session {
  return {
    id: `session-w${weekNumber}-d${dayNumber}-${mesoId}`,
    mesoId,
    weekNumber,
    dayNumber,
    isDeload: weekNumber === SOURCE.lengthWeeks,
    prescriptionStatus: 'ready',
    status,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  };
}

describe('buildSourceWeekOptions', () => {
  // DoD: weeks lazy generation never reached don't appear — they don't exist.
  test('offers only weeks that have sessions', () => {
    const options = buildSourceWeekOptions(SOURCE, [
      session(1, 1, 'completed'),
      session(2, 1, 'completed'),
    ]);

    expect(options.map((option) => option.weekNumber)).toEqual([1, 2]);
  });

  // DoD: the deload week can't be chosen — here, by never being on offer at all. The reason lives
  // under the Week field instead of beside a row nobody can pick (08.8, 23.09.2026).
  test('leaves the deload week out entirely', () => {
    const options = buildSourceWeekOptions(SOURCE, [
      session(5, 1, 'completed'),
      session(6, 1, 'completed'),
    ]);

    expect(options.map((option) => option.weekNumber)).toEqual([5]);
  });

  // DoD: a week where nothing was finished is selectable like any other — structure is what gets
  // copied, and an untrained week has as much of it (04, 22.09.2026).
  test('offers a week with nothing completed, counted honestly', () => {
    const options = buildSourceWeekOptions(SOURCE, [
      session(4, 1, 'planned'),
      session(4, 2, 'planned'),
    ]);

    expect(options).toEqual([{ weekNumber: 4, completedCount: 0, sessionCount: 2 }]);
  });

  test('counts completed sessions only — a skipped workout did not happen', () => {
    const options = buildSourceWeekOptions(SOURCE, [
      session(3, 1, 'completed'),
      session(3, 2, 'skipped'),
      session(3, 3, 'in_progress'),
      session(3, 4, 'completed'),
    ]);

    expect(options).toEqual([{ weekNumber: 3, completedCount: 2, sessionCount: 4 }]);
  });

  test('ignores sessions of another mesocycle', () => {
    const options = buildSourceWeekOptions(SOURCE, [
      session(2, 1, 'completed'),
      session(2, 2, 'completed', 'meso-other'),
    ]);

    expect(options).toEqual([{ weekNumber: 2, completedCount: 1, sessionCount: 1 }]);
  });

  test('sorts ascending by week number, whatever order the sessions arrive in', () => {
    const options = buildSourceWeekOptions(SOURCE, [
      session(3, 1, 'completed'),
      session(1, 1, 'completed'),
      session(2, 1, 'completed'),
    ]);

    expect(options.map((option) => option.weekNumber)).toEqual([1, 2, 3]);
  });

  test('offers nothing for a block whose only week is its deload one', () => {
    expect(buildSourceWeekOptions(SOURCE, [session(6, 1, 'completed')])).toEqual([]);
  });
});

describe('defaultSourceWeekNumber', () => {
  test('is the last working week on offer', () => {
    const options = buildSourceWeekOptions(SOURCE, [
      session(1, 1, 'completed'),
      session(4, 1, 'completed'),
      session(6, 1, 'completed'),
    ]);

    expect(defaultSourceWeekNumber(options)).toBe(4);
  });

  test('is undefined when there is nothing to copy', () => {
    expect(defaultSourceWeekNumber([])).toBeUndefined();
  });
});
