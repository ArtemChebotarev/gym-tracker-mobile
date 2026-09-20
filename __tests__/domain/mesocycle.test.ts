import type { Mesocycle, MesocycleOrigin } from '@domain/mesocycle';
import { defaultProgressionSettings } from '@domain/mesocycle';
import type { WeekPlan } from '@domain/plan';
import { STAMPS } from '../fixtures/stamps';

function describeOrigin(origin: MesocycleOrigin): string {
  switch (origin.type) {
    case 'scratch':
      return 'built from scratch';
    case 'template':
      // `templateId` is only reachable once narrowed to the `template` variant.
      return `built from template ${origin.templateId}`;
    case 'copyWeek':
      // `sourceMesoId` / `sourceWeekNumber` are only reachable once narrowed to `copyWeek`.
      return `copied week ${origin.sourceWeekNumber} from meso ${origin.sourceMesoId}`;
  }
}

const scratchOrigin: MesocycleOrigin = { type: 'scratch' };
const templateOrigin: MesocycleOrigin = { type: 'template', templateId: 'template-1' };
const copyWeekOrigin: MesocycleOrigin = {
  type: 'copyWeek',
  sourceMesoId: 'meso-1',
  sourceWeekNumber: 3,
};

const mesocycleFixture: Mesocycle = {
  ...STAMPS,
  id: 'meso-1',
  name: 'Push/Pull/Legs',
  lengthWeeks: 6,
  daysPerWeek: 4,
  startDate: '2026-08-24T00:00:00.000Z',
  status: 'active',
  origin: scratchOrigin,
  progressionSettings: defaultProgressionSettings,
  createdAt: '2026-08-24T00:00:00.000Z',
};

describe('mesocycle domain types', () => {
  test('origin narrows on `type` without casts, in a switch', () => {
    expect(describeOrigin(scratchOrigin)).toBe('built from scratch');
    expect(describeOrigin(templateOrigin)).toBe('built from template template-1');
    expect(describeOrigin(copyWeekOrigin)).toBe('copied week 3 from meso meso-1');
  });

  test('origin narrows on `type` without casts, in an if/else chain', () => {
    function assertNarrowing(origin: MesocycleOrigin): void {
      if (origin.type === 'scratch') {
        throw new Error('unexpected scratch origin');
      } else if (origin.type === 'template') {
        expect(origin.templateId).toBe('template-1');
      } else {
        expect(origin.sourceMesoId).toBeDefined();
        expect(origin.sourceWeekNumber).toBeDefined();
      }
    }

    assertNarrowing(templateOrigin);
  });

  test('a full mesocycle fixture typechecks', () => {
    expect(mesocycleFixture.status).toBe('active');
    expect(mesocycleFixture.completedAt).toBeUndefined();
  });

  test('a planned mesocycle typechecks with no startDate and a draft weekPlan', () => {
    const weekPlan: WeekPlan = {
      days: [{ dayNumber: 1, name: '', exercises: [] }],
    };
    const plannedFixture: Mesocycle = {
      ...mesocycleFixture,
      status: 'planned',
      startDate: undefined,
      weekPlan,
    };

    expect(plannedFixture.status).toBe('planned');
    expect(plannedFixture.startDate).toBeUndefined();
    expect(plannedFixture.weekPlan).toEqual(weekPlan);
  });

  test('defaultProgressionSettings matches the spec defaults', () => {
    expect(defaultProgressionSettings).toEqual({
      minReps: 5,
      maxReps: 30,
      deloadRir: 8,
      deloadWeightFactor: 0.5,
      historyLookbackDays: 30,
    });
  });
});
