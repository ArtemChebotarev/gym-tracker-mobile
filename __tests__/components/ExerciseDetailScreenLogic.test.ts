import type { SetLog } from '@domain/execution';
import {
  formatBestSet,
  formatEarlierSessionLabel,
  formatEarlierSessionTail,
  formatEarlierSessionValue,
  formatLastDone,
  formatLastSessionMeta,
  formatSetLabel,
  formatSetRirTail,
  formatSetValue,
} from '@components/ExerciseDetailScreenLogic';
import { STAMPS } from '../fixtures/stamps';

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    ...STAMPS,
    id: 'log-1',
    sessionExerciseId: 'se-1',
    exerciseId: 'bench-press',
    setNumber: 1,
    weight: 85,
    reps: 8,
    completedAt: '2026-09-10T12:00:00.000Z',
    ...overrides,
  };
}

describe('formatBestSet', () => {
  test('is weight by reps, with no unit', () => {
    expect(formatBestSet({ weight: 85, reps: 8 })).toBe('85×8');
  });
});

describe('formatLastDone', () => {
  test('counts days up to a week', () => {
    expect(formatLastDone('2026-09-17T12:00:00.000Z', new Date('2026-09-20T12:00:00.000Z'))).toBe(
      '3 d',
    );
  });

  test('switches to weeks past one', () => {
    expect(formatLastDone('2026-09-01T12:00:00.000Z', new Date('2026-09-20T12:00:00.000Z'))).toBe(
      '2 w',
    );
  });
});

describe('formatLastSessionMeta', () => {
  test('is week, day and date', () => {
    expect(
      formatLastSessionMeta({
        weekNumber: 3,
        dayNumber: 1,
        completedAt: '2026-08-10T12:00:00.000Z',
        setLogs: [],
      }),
    ).toBe('Week 3 · Day 1 · 10 Aug');
  });
});

describe('a logged set row', () => {
  test('labels the set by its number', () => {
    expect(formatSetLabel(setLog({ setNumber: 2 }))).toBe('Set 2');
  });

  test('reads weight by reps, with the RIR kept out of the value', () => {
    const log = setLog({ weight: 80, reps: 9, rir: 2 });

    expect(formatSetValue(log)).toBe('80 kg × 9');
    expect(formatSetRirTail(log)).toBe(' · 2 RIR');
  });

  test('has no tail at all when the set has no RIR', () => {
    expect(formatSetRirTail(setLog())).toBeUndefined();
  });

  test('keeps a weighted bodyweight set’s body weight and added weight apart', () => {
    expect(formatSetValue(setLog({ weight: 5, bodyWeight: 83 }), 'bodyweight-weighted')).toBe(
      '83 (+5) kg × 8',
    );
  });
});

describe('an earlier session row', () => {
  const session = {
    weekNumber: 2,
    dayNumber: 1,
    completedAt: '2026-08-03T12:00:00.000Z',
    bestSet: { weight: 80, reps: 8 },
    setCount: 3,
  };

  test('reads as week, day and date on the left', () => {
    expect(formatEarlierSessionLabel(session)).toBe('W2 · D1 · 3 Aug');
  });

  test('reads as its heaviest set on the right, with the set count as a tail', () => {
    expect(formatEarlierSessionValue(session)).toBe('80 × 8');
    expect(formatEarlierSessionTail(session)).toBe(' · 3 sets');
  });

  test('says one set in the singular', () => {
    expect(formatEarlierSessionTail({ ...session, setCount: 1 })).toBe(' · 1 set');
  });
});
