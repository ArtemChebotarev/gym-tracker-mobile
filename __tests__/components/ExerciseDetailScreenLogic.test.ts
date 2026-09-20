import type { SetLog } from '@domain/execution';
import {
  formatBestSet,
  formatLastDone,
  formatLastSessionTitle,
  formatMesocyclesUsed,
  formatOverviewSet,
  formatSetsLogged,
} from '@components/ExerciseDetailScreenLogic';

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
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

describe('formatLastSessionTitle', () => {
  test('is week, day and date', () => {
    expect(
      formatLastSessionTitle({
        weekNumber: 3,
        dayNumber: 2,
        completedAt: '2026-09-17T12:00:00.000Z',
        setLogs: [],
      }),
    ).toBe('Week 3 · Day 2 · 17 Sep');
  });
});

describe('formatOverviewSet', () => {
  test('is weight, reps and RIR', () => {
    expect(formatOverviewSet(setLog({ rir: 2 }))).toBe('85 kg × 8 · 2 RIR');
  });

  test('drops the tail entirely when the set has no RIR', () => {
    expect(formatOverviewSet(setLog())).toBe('85 kg × 8');
  });

  test('keeps a weighted bodyweight set’s body weight and added weight apart', () => {
    expect(formatOverviewSet(setLog({ weight: 5, bodyWeight: 83 }), 'bodyweight-weighted')).toBe(
      '83 (+5) kg × 8',
    );
  });
});

describe('the History link’s counts', () => {
  test('read as plurals', () => {
    expect(formatMesocyclesUsed(3)).toBe('Used in 3 mesocycles');
    expect(formatSetsLogged(124)).toBe('124 sets logged all-time');
  });

  test('read as singulars at one', () => {
    expect(formatMesocyclesUsed(1)).toBe('Used in 1 mesocycle');
    expect(formatSetsLogged(1)).toBe('1 set logged all-time');
  });
});
