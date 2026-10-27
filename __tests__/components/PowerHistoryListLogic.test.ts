import type { SetLog } from '@domain/execution';
import type { ExerciseHistoryMesocycle, PowerHistoryWeek } from '@domain/exerciseHistory';
import {
  buildPowerHistorySections,
  formatPowerBestSet,
  formatPowerWeekLabel,
  formatPowerWeekTail,
} from '@components/PowerHistoryListLogic';
import { STAMPS } from '../fixtures/stamps';

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    ...STAMPS,
    id: 'log-1',
    sessionExerciseId: 'se-1',
    exerciseId: 'box-jump',
    setNumber: 1,
    weight: 2,
    reps: 4,
    completedAt: '2026-08-10T12:00:00.000Z',
    ...overrides,
  };
}

function week(overrides: Partial<PowerHistoryWeek> = {}): PowerHistoryWeek {
  return {
    id: 'meso-1:3',
    weekNumber: 3,
    bestSet: setLog(),
    isAtTopOfRange: false,
    ...overrides,
  };
}

describe('buildPowerHistorySections', () => {
  test('gives each mesocycle one item holding its weeks, and counts them', () => {
    const groups: ExerciseHistoryMesocycle[] = [
      {
        mesoId: 'meso-1',
        name: 'Upper/Lower',
        sessions: [
          {
            id: 'a',
            weekNumber: 2,
            dayNumber: 1,
            completedAt: '2026-08-10T12:00:00.000Z',
            setLogs: [setLog({ id: 'a' })],
          },
          {
            id: 'b',
            weekNumber: 1,
            dayNumber: 1,
            completedAt: '2026-08-03T12:00:00.000Z',
            setLogs: [setLog({ id: 'b' })],
          },
        ],
      },
    ];

    const [section] = buildPowerHistorySections(groups, 'level');

    expect(section?.title).toBe('Upper/Lower');
    expect(section?.weekCount).toBe(2);
    expect(section?.data).toHaveLength(1);
    expect(section?.data[0].map((entry) => entry.weekNumber)).toEqual([2, 1]);
  });
});

describe('formatPowerWeekLabel', () => {
  test('names the week', () => {
    expect(formatPowerWeekLabel(week())).toBe('Week 3');
  });
});

describe('formatPowerBestSet', () => {
  test('reads kilograms, a level, or the body weight the way the Load column does', () => {
    expect(formatPowerBestSet(week({ bestSet: setLog({ weight: 6, reps: 5 }) }), 'weight')).toBe(
      '6 kg × 5',
    );
    expect(formatPowerBestSet(week(), 'level')).toBe('Level 2 × 4');
    expect(formatPowerBestSet(week({ bestSet: setLog({ weight: 80, reps: 5 }) }), 'none')).toBe(
      '80 kg × 5',
    );
  });
});

describe('formatPowerWeekTail', () => {
  test('is absent for a week that went on as planned', () => {
    expect(formatPowerWeekTail(week(), 'weight')).toBeUndefined();
  });

  test('names a load change in the words of the load', () => {
    expect(formatPowerWeekTail(week({ loadChange: 'up' }), 'weight')).toBe(' · Heavier');
    expect(formatPowerWeekTail(week({ loadChange: 'down' }), 'weight')).toBe(' · Lighter');
    expect(formatPowerWeekTail(week({ loadChange: 'up' }), 'level')).toBe(' · Higher level');
    expect(formatPowerWeekTail(week({ loadChange: 'down' }), 'level')).toBe(' · Lower level');
  });

  test('says when every set reached the top, after a load change', () => {
    expect(formatPowerWeekTail(week({ loadChange: 'up', isAtTopOfRange: true }), 'level')).toBe(
      ' · Higher level · Top of range',
    );
    expect(formatPowerWeekTail(week({ isAtTopOfRange: true }), 'none')).toBe(' · Top of range');
  });
});
