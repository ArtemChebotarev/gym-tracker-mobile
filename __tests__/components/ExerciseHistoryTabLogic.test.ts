import type { ExerciseHistoryMesocycle, ExerciseHistorySession } from '@domain/exerciseHistory';
import {
  buildHistorySections,
  formatHistorySessionDate,
  formatHistorySessionLabel,
} from '@components/ExerciseHistoryTabLogic';

function historySession(overrides: Partial<ExerciseHistorySession> = {}): ExerciseHistorySession {
  return {
    id: 'log-1',
    weekNumber: 3,
    dayNumber: 1,
    completedAt: '2026-08-10T12:00:00.000Z',
    setLogs: [],
    ...overrides,
  };
}

describe('buildHistorySections', () => {
  test('turns each mesocycle into a section keeping its order', () => {
    const groups: ExerciseHistoryMesocycle[] = [
      { mesoId: 'meso-2', name: 'Full body', sessions: [historySession({ id: 'b' })] },
      { mesoId: 'meso-1', name: 'Upper/Lower', sessions: [historySession({ id: 'a' })] },
    ];

    expect(buildHistorySections(groups)).toEqual([
      { mesoId: 'meso-2', title: 'Full body', data: groups[0]?.sessions },
      { mesoId: 'meso-1', title: 'Upper/Lower', data: groups[1]?.sessions },
    ]);
  });
});

describe('a session card in the history list', () => {
  test('is labelled by week and day, the mesocycle being the section above it', () => {
    expect(formatHistorySessionLabel(historySession())).toBe('Week 3 · Day 1');
  });

  test('carries its date beside that label', () => {
    expect(formatHistorySessionDate(historySession())).toBe('10 Aug');
  });
});
