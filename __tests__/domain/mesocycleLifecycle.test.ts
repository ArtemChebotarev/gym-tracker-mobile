import { isConflictError } from '@domain/errors';
import type { Session } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import {
  assertMesocycleActive,
  canFinishMesocycle,
  closedMesocycle,
  FINAL_MESOCYCLE_STATUSES,
  archivedMesocycle,
  finishedMesocyclesNewestFirst,
  isArchivedMesocycle,
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

/** A fixed "now" for the archive stamp — the rules never read the clock themselves. */
const NOW = '2026-09-25T10:00:00.000Z';

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

// Shared by 08.3's Completed group and Flow C's source dropdown (124) — the two must agree on
// which blocks have ended and in what order.
describe('finishedMesocyclesNewestFirst', () => {
  function closed(id: string, status: Mesocycle['status'], completedAt?: string): Mesocycle {
    return { ...mesocycle, id, status, completedAt };
  }

  test('keeps finished and stopped blocks, and nothing else', () => {
    const result = finishedMesocyclesNewestFirst([
      closed('done', 'completed', '2026-08-01T00:00:00.000Z'),
      closed('running', 'active'),
      closed('stopped', 'abandoned', '2026-08-02T00:00:00.000Z'),
      closed('upcoming', 'planned'),
    ]);

    expect(result.map((block) => block.id)).toEqual(['stopped', 'done']);
  });

  test('orders by when they ended, newest first', () => {
    const result = finishedMesocyclesNewestFirst([
      closed('older', 'completed', '2026-06-01T00:00:00.000Z'),
      closed('newest', 'completed', '2026-09-01T00:00:00.000Z'),
      closed('middle', 'completed', '2026-07-01T00:00:00.000Z'),
    ]);

    expect(result.map((block) => block.id)).toEqual(['newest', 'middle', 'older']);
  });

  test('puts a block with no end date last rather than throwing the order off', () => {
    const result = finishedMesocyclesNewestFirst([
      closed('undated', 'completed'),
      closed('dated', 'completed', '2026-06-01T00:00:00.000Z'),
    ]);

    expect(result.map((block) => block.id)).toEqual(['dated', 'undated']);
  });

  test('leaves out an archived block — hidden from the list and from Flow C alike', () => {
    const result = finishedMesocyclesNewestFirst([
      closed('kept', 'completed', '2026-08-01T00:00:00.000Z'),
      { ...closed('hidden', 'completed', '2026-09-01T00:00:00.000Z'), archivedAt: NOW },
      { ...closed('hidden-stopped', 'abandoned', '2026-09-02T00:00:00.000Z'), archivedAt: NOW },
    ]);

    expect(result.map((block) => block.id)).toEqual(['kept']);
  });

  test('does not mutate the list it was given', () => {
    const input = [
      closed('older', 'completed', '2026-06-01T00:00:00.000Z'),
      closed('newest', 'completed', '2026-09-01T00:00:00.000Z'),
    ];

    finishedMesocyclesNewestFirst(input);

    expect(input.map((block) => block.id)).toEqual(['older', 'newest']);
  });
});

describe('isArchivedMesocycle', () => {
  test('is the presence of archivedAt, nothing more', () => {
    expect(isArchivedMesocycle({ archivedAt: undefined })).toBe(false);
    expect(isArchivedMesocycle({ archivedAt: NOW })).toBe(true);
  });
});

describe('archivedMesocycle', () => {
  const finished: Mesocycle = {
    ...mesocycle,
    status: 'completed',
    completedAt: '2026-09-20T08:00:00.000Z',
  };

  test.each(['completed', 'abandoned'] as const)(
    'stamps archivedAt on a %s block and changes nothing else',
    (status) => {
      const block = { ...finished, status };

      expect(archivedMesocycle(block, NOW)).toEqual({ ...block, archivedAt: NOW });
    },
  );

  test.each(['planned', 'active'] as const)(
    'refuses a %s block — it is deleted or closed, not archived',
    (status) => {
      let error: unknown;
      try {
        archivedMesocycle({ ...finished, status }, NOW);
      } catch (thrown) {
        error = thrown;
      }
      expect(isConflictError(error)).toBe(true);
    },
  );

  test('refuses a block that is archived already, so the first date survives', () => {
    const already = { ...finished, archivedAt: '2026-09-21T08:00:00.000Z' };

    expect(() => archivedMesocycle(already, NOW)).toThrow(/already archived/);
  });
});
