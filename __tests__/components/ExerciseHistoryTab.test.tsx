import { render, screen } from '@testing-library/react-native';

import type { SetLog } from '@domain/execution';
import type { ExerciseHistoryMesocycle } from '@domain/exerciseHistory';
import {
  ExerciseHistoryTab,
  type ExerciseHistoryTabProps,
} from '@components/ExerciseHistoryTab';

function setLog(overrides: Partial<SetLog> = {}): SetLog {
  return {
    id: 'log-1',
    sessionExerciseId: 'se-1',
    exerciseId: 'bench-press',
    setNumber: 1,
    weight: 80,
    reps: 9,
    completedAt: '2026-08-10T12:00:00.000Z',
    ...overrides,
  };
}

const GROUPS: ExerciseHistoryMesocycle[] = [
  {
    mesoId: 'meso-2',
    name: 'Full body',
    sessions: [
      {
        id: 'log-3',
        weekNumber: 1,
        dayNumber: 2,
        completedAt: '2026-09-17T12:00:00.000Z',
        setLogs: [setLog({ id: 'log-3', weight: 85, reps: 8, rir: 2 })],
      },
    ],
  },
  {
    mesoId: 'meso-1',
    name: 'Upper/Lower',
    sessions: [
      {
        id: 'log-1',
        weekNumber: 3,
        dayNumber: 1,
        completedAt: '2026-08-10T12:00:00.000Z',
        setLogs: [setLog({ rir: 2 }), setLog({ id: 'log-2', setNumber: 2, reps: 8 })],
      },
    ],
  },
];

function renderTab(overrides: Partial<ExerciseHistoryTabProps> = {}) {
  const props: ExerciseHistoryTabProps = {
    groups: GROUPS,
    isPending: false,
    ...overrides,
  };
  render(<ExerciseHistoryTab {...props} />);
  return props;
}

describe('ExerciseHistoryTab', () => {
  test('heads a section with each mesocycle and how many of its sessions are listed', () => {
    renderTab();

    expect(screen.getByText('Full body')).toBeTruthy();
    expect(screen.getByText('Upper/Lower')).toBeTruthy();
  });

  test('labels every session by week and day, with its date beside it', () => {
    renderTab();

    expect(screen.getByText('Week 3 · Day 1')).toBeTruthy();
    expect(screen.getByText('10 Aug')).toBeTruthy();
    expect(screen.getByText('Week 1 · Day 2')).toBeTruthy();
    expect(screen.getByText('17 Sep')).toBeTruthy();
  });

  test('lists every set of a session', () => {
    renderTab();

    // One `Set 1` per listed session, `Set 2` only in the one that had a second set.
    expect(screen.getAllByText('Set 1')).toHaveLength(2);
    expect(screen.getByText('Set 2')).toBeTruthy();
    expect(screen.getByText('80 kg × 9 · 2 RIR')).toBeTruthy();
    expect(screen.getByText('85 kg × 8 · 2 RIR')).toBeTruthy();
  });

  test('a set with no RIR renders without the tail', () => {
    renderTab();

    expect(screen.getByText('80 kg × 8')).toBeTruthy();
  });

  test('splits a weighted bodyweight set the way it was logged', () => {
    renderTab({
      equipment: 'bodyweight-weighted',
      groups: [
        {
          mesoId: 'meso-1',
          name: 'Upper/Lower',
          sessions: [
            {
              id: 'log-1',
              weekNumber: 1,
              dayNumber: 1,
              completedAt: '2026-08-10T12:00:00.000Z',
              setLogs: [setLog({ weight: 5, bodyWeight: 83 })],
            },
          ],
        },
      ],
    });

    expect(screen.getByText('83 (+5) kg × 9')).toBeTruthy();
  });

  test('shows a loading line until the history is read', () => {
    renderTab({ groups: undefined, isPending: true });

    expect(screen.getByText('Loading…')).toBeTruthy();
  });

  test('renders nothing but the list when a mesocycle has no sessions left to show', () => {
    renderTab({ groups: [] });

    expect(screen.queryByText('Upper/Lower')).toBeNull();
  });
});
