import { isConflictError } from '@domain/errors';
import type { Session } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import {
  assertMesocycleActive,
  canFinishMesocycle,
  closedMesocycle,
  FINAL_MESOCYCLE_STATUSES,
  isFinalMesocycle,
  unfinishedSessions,
} from '@domain/mesocycleLifecycle';

import { STAMPS } from '../fixtures/stamps';

const mesocycle: Mesocycle = {
  ...STAMPS,
  id: 'meso',
  name: 'Upper/Lower',
  lengthWeeks: 4,
  daysPerWeek: 2,
  startDate: '2026-09-01T08:00:00.000Z',
  status: 'active',
  origin: { type: 'scratch' },
  progressionSettings: defaultProgressionSettings,
};

function session(id: string, status: Session['status'], mesoId = 'meso'): Session {
  return {
    ...STAMPS,
    id,
    mesoId,
    weekNumber: 1,
    dayNumber: 1,
    isDeload: false,
    prescriptionStatus: 'ready',
    status,
  };
}

describe('isFinalMesocycle', () => {
  test('completed and abandoned are the final statuses', () => {
    expect(FINAL_MESOCYCLE_STATUSES).toEqual(['completed', 'abandoned']);
    expect(isFinalMesocycle({ status: 'completed' })).toBe(true);
    expect(isFinalMesocycle({ status: 'abandoned' })).toBe(true);
    expect(isFinalMesocycle({ status: 'active' })).toBe(false);
    expect(isFinalMesocycle({ status: 'planned' })).toBe(false);
  });
});

describe('assertMesocycleActive', () => {
  test('lets an active mesocycle through', () => {
    expect(() => assertMesocycleActive(mesocycle)).not.toThrow();
  });

  test.each(['planned', 'completed', 'abandoned'] as const)('rejects a %s one', (status) => {
    let error: unknown;
    try {
      assertMesocycleActive({ ...mesocycle, status });
    } catch (thrown) {
      error = thrown;
    }
    expect(isConflictError(error)).toBe(true);
  });
});

describe('unfinishedSessions', () => {
  test('is everything not completed or skipped, in the mesocycle itself', () => {
    const sessions = [
      session('done', 'completed'),
      session('skipped', 'skipped'),
      session('live', 'in_progress'),
      session('ready', 'planned'),
      session('other-block', 'planned', 'another-meso'),
    ];

    expect(unfinishedSessions(mesocycle, sessions).map((left) => left.id)).toEqual([
      'live',
      'ready',
    ]);
  });
});

describe('canFinishMesocycle', () => {
  test('DoD: Finish is offered once every session of an active block is final', () => {
    const sessions = [session('done', 'completed'), session('skipped', 'skipped')];

    expect(canFinishMesocycle(mesocycle, sessions)).toBe(true);
  });

  test('not while a session is still to be trained — that block is stopped, not finished', () => {
    expect(canFinishMesocycle(mesocycle, [session('done', 'completed'), session('ready', 'planned')])).toBe(
      false,
    );
    expect(canFinishMesocycle(mesocycle, [session('live', 'in_progress')])).toBe(false);
  });

  test.each(['planned', 'completed', 'abandoned'] as const)(
    'never for a %s block, whatever its sessions say',
    (status) => {
      expect(canFinishMesocycle({ ...mesocycle, status }, [session('done', 'completed')])).toBe(
        false,
      );
    },
  );

  test("another block's unfinished sessions don't hold this one open", () => {
    expect(
      canFinishMesocycle(mesocycle, [
        session('done', 'completed'),
        session('other-block', 'planned', 'another-meso'),
      ]),
    ).toBe(true);
  });
});

describe('closedMesocycle', () => {
  test('DoD: both ways out set the status and completedAt', () => {
    expect(closedMesocycle(mesocycle, 'completed', '2026-09-28T18:00:00.000Z')).toEqual({
      ...mesocycle,
      status: 'completed',
      completedAt: '2026-09-28T18:00:00.000Z',
    });
    expect(closedMesocycle(mesocycle, 'abandoned', '2026-09-28T18:00:00.000Z')).toEqual({
      ...mesocycle,
      status: 'abandoned',
      completedAt: '2026-09-28T18:00:00.000Z',
    });
  });
});
