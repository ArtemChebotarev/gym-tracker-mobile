import type { WeekPlan } from '@domain/plan';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { SqliteSessionRepository } from '@storage/sqlite/session';
import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import { confirmScratchMesocycleDraft } from '@usecases/mesocycleCreation';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const twoDayWeekPlan: WeekPlan = {
  days: [
    {
      dayNumber: 1,
      name: '',
      exercises: [{ exerciseId: 'exercise-bench-press', order: 1, sets: 3 }],
    },
    { dayNumber: 2, name: '', exercises: [{ exerciseId: 'exercise-squat', order: 1, sets: 4 }] },
  ],
};

function makeDeps() {
  const store = db();
  return {
    mesocycleRepo: new SqliteMesocycleRepository(store),
    sessionRepo: new SqliteSessionRepository(store),
    settingsRepo: new SqliteSettingsRepository(db()),
  };
}

const draftInput = {
  name: 'Push/Pull/Legs',
  lengthWeeks: 6,
  daysPerWeek: 2,
  weekPlan: twoDayWeekPlan,
};

describe('confirmScratchMesocycleDraft', () => {
  test('saves a planned mesocycle with the correct origin and no startDate', async () => {
    const deps = makeDeps();

    const saved = await confirmScratchMesocycleDraft(
      { name: 'Push/Pull/Legs', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan },
      deps,
    );

    expect(saved.status).toBe('planned');
    expect(saved.startDate).toBeUndefined();
    expect(saved.origin).toEqual({ type: 'scratch' });
    await expect(deps.mesocycleRepo.getById(saved.id)).resolves.toEqual(saved);
  });

  test('creates no Session for the confirmed mesocycle', async () => {
    const deps = makeDeps();

    const saved = await confirmScratchMesocycleDraft(
      { name: 'Push/Pull/Legs', lengthWeeks: 6, daysPerWeek: 2, weekPlan: twoDayWeekPlan },
      deps,
    );

    await expect(deps.sessionRepo.listByMesoId(saved.id)).resolves.toEqual([]);
  });

  test('confirming the same draft input twice creates two independent records, not an update', async () => {
    const deps = makeDeps();
    const input = {
      name: 'Push/Pull/Legs',
      lengthWeeks: 6,
      daysPerWeek: 2,
      weekPlan: twoDayWeekPlan,
    };

    const first = await confirmScratchMesocycleDraft(input, deps);
    const second = await confirmScratchMesocycleDraft(input, deps);

    expect(first.id).not.toBe(second.id);
    await expect(deps.mesocycleRepo.getAll()).resolves.toEqual(
      expect.arrayContaining([first, second]),
    );
    await expect(deps.mesocycleRepo.getAll()).resolves.toHaveLength(2);
  });

  test('a new mesocycle gets historyLookbackDays 30 from the default settings', async () => {
    const deps = makeDeps();

    const saved = await confirmScratchMesocycleDraft(draftInput, deps);

    expect(saved.progressionSettings.historyLookbackDays).toBe(30);
    const stored = await deps.mesocycleRepo.getById(saved.id);
    expect(stored?.progressionSettings.historyLookbackDays).toBe(30);
  });

  test('snapshots the global progression settings as they are at creation time', async () => {
    const deps = makeDeps();
    const settings = await deps.settingsRepo.read();
    await deps.settingsRepo.write({
      ...settings,
      defaultProgressionSettings: {
        ...settings.defaultProgressionSettings,
        historyLookbackDays: 45,
      },
    });

    const saved = await confirmScratchMesocycleDraft(draftInput, deps);

    expect(saved.progressionSettings.historyLookbackDays).toBe(45);
  });

  test('changing the global setting afterwards does not change an already created mesocycle', async () => {
    const deps = makeDeps();
    const saved = await confirmScratchMesocycleDraft(draftInput, deps);

    const settings = await deps.settingsRepo.read();
    await deps.settingsRepo.write({
      ...settings,
      defaultProgressionSettings: {
        ...settings.defaultProgressionSettings,
        historyLookbackDays: 90,
      },
    });

    const stored = await deps.mesocycleRepo.getById(saved.id);
    expect(stored?.progressionSettings.historyLookbackDays).toBe(30);
  });
});
