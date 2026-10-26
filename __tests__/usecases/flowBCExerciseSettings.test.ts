// GT-159 end to end, over SQLite (Artem, 18.10.2026): a copied week (Flow C) opens the editor
// with the settings its power, interval and mobility exercises ran with in the source cycle,
// library defaults for one the source has none for; a template (Flow B) gives library defaults.

import type { Session, SessionExercise } from '@domain/execution';
import { DEFAULT_INTERVAL_ROUNDS } from '@domain/exerciseConfigBuilders';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { Unsaved } from '@domain/timestamps';
import {
  toCopiedMesoBuilderDraft,
  toCopyWeekMesocycleConfirmInput,
  toTemplateMesoBuilderDraft,
} from '@state/draftStore';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { SqliteRoundLogRepository } from '@storage/sqlite/roundLogRepository';
import { SqliteSessionRepository } from '@storage/sqlite/session';
import { SqliteSessionExerciseRepository } from '@storage/sqlite/sessionExercise';
import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import { SqliteTemplateRepository } from '@storage/sqlite/template';
import {
  confirmCopyWeekMesocycleDraft,
  extractSourceWeek,
  prepareTemplateDraft,
} from '@usecases/mesocycleCreation';
import { startMesocycle } from '@usecases/mesocycleStart';
import { createSqliteMesocycleStartStore } from '@storage/sqlite/mesocycleStartStore';
import { COOLDOWN, HEAVY_BAG, HEAVY_BAG_CONFIG, MEDBALL_THROW } from '../fixtures/hybridExercises';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

function makeDeps() {
  const store = db();
  return {
    mesocycleRepo: new SqliteMesocycleRepository(store),
    sessionRepo: new SqliteSessionRepository(store),
    sessionExerciseRepo: new SqliteSessionExerciseRepository(store),
    exerciseRepo: new SqliteExerciseRepository(store),
    roundLogRepo: new SqliteRoundLogRepository(store),
    settingsRepo: new SqliteSettingsRepository(store),
    templateRepo: new SqliteTemplateRepository(store),
  };
}

const SOURCE_ID = 'meso-source';

// What the source cycle ran with: both edited away from the library. Cooldown has no entry — a
// cycle saved before the cycle kept its own settings.
const SOURCE_SETTINGS: Mesocycle['exerciseSettings'] = {
  [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, restSec: 30, rounds: 5 },
  [MEDBALL_THROW.id]: { type: 'power', load: 'weight', restSec: 90, noHeavierAvailable: true },
};

function sessionExercise(id: string, exerciseId: string, order: number): Unsaved<SessionExercise> {
  return {
    id,
    sessionId: 'session-w1-d1',
    exerciseId,
    order,
    setTargets: [{ setNumber: 1 }, { setNumber: 2 }],
    targetRir: 2,
    status: 'completed',
  };
}

async function seedHybridLibrary(deps: ReturnType<typeof makeDeps>) {
  for (const exercise of [MEDBALL_THROW, HEAVY_BAG, COOLDOWN]) {
    await deps.exerciseRepo.createCustom(exercise);
  }
}

async function seedSource(deps: ReturnType<typeof makeDeps>) {
  await seedHybridLibrary(deps);
  await deps.mesocycleRepo.create({
    id: SOURCE_ID,
    name: 'Hybrid',
    lengthWeeks: 4,
    daysPerWeek: 1,
    startDate: '2026-09-01T00:00:00.000Z',
    status: 'completed',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    completedAt: '2026-10-01T00:00:00.000Z',
    exerciseSettings: SOURCE_SETTINGS,
  });
  const session: Unsaved<Session> = {
    id: 'session-w1-d1',
    mesoId: SOURCE_ID,
    weekNumber: 1,
    dayNumber: 1,
    name: '',
    isDeload: false,
    prescriptionStatus: 'ready',
    status: 'completed',
  };
  await deps.sessionRepo.createMany([session]);
  await deps.sessionExerciseRepo.createMany([
    sessionExercise('sx-medball', MEDBALL_THROW.id, 1),
    sessionExercise('sx-bag', HEAVY_BAG.id, 2),
    sessionExercise('sx-cooldown', COOLDOWN.id, 3),
  ]);
}

describe('Flow C: settings come from the source cycle (GT-159)', () => {
  test('the copy opens the editor with the source’s settings, library defaults where it had none', async () => {
    const deps = makeDeps();
    await seedSource(deps);

    const week = await extractSourceWeek({ sourceMesoId: SOURCE_ID, sourceWeekNumber: 1 }, deps);
    const source = (await deps.mesocycleRepo.getById(SOURCE_ID))!;
    const draft = toCopiedMesoBuilderDraft(source, week.weekPlan, 1, week.exerciseSettings);

    expect(draft.exerciseSettings).toEqual({
      ...SOURCE_SETTINGS,
      // The week had two untimed rounds: the count is the week's, the times the cycle's.
      [HEAVY_BAG.id]: { ...SOURCE_SETTINGS![HEAVY_BAG.id], rounds: 2 },
      [COOLDOWN.id]: COOLDOWN.config,
    });
  });

  test('saving the copy keeps those settings, and the source cycle is left as it was', async () => {
    const deps = makeDeps();
    await seedSource(deps);
    const week = await extractSourceWeek({ sourceMesoId: SOURCE_ID, sourceWeekNumber: 1 }, deps);
    const source = (await deps.mesocycleRepo.getById(SOURCE_ID))!;
    const draft = toCopiedMesoBuilderDraft(source, week.weekPlan, 1, week.exerciseSettings);

    const saved = await confirmCopyWeekMesocycleDraft(toCopyWeekMesocycleConfirmInput(draft), deps);

    expect((await deps.mesocycleRepo.getById(saved.id))?.exerciseSettings).toEqual(
      draft.exerciseSettings,
    );
    expect((await deps.mesocycleRepo.getById(SOURCE_ID))?.exerciseSettings).toEqual(
      SOURCE_SETTINGS,
    );
  });
});

// Artem, 26.10.2026: an interval's rounds, work and rest are structure — the copy takes them from
// the week as it ended, and Start lays week 1 out from them with no lever step.
describe('Flow C: an interval starts as the copied week ended', () => {
  async function seedBag(
    deps: ReturnType<typeof makeDeps>,
    setTargets: SessionExercise['setTargets'],
    logs: {
      roundNumber: number;
      workSec: number;
      restSec: number;
      restSkipped?: boolean;
      completed?: boolean;
    }[],
  ) {
    await seedSource(deps);
    const exercises = await deps.sessionExerciseRepo.listBySessionId('session-w1-d1');
    const bag = exercises.find((exercise) => exercise.id === 'sx-bag')!;
    await deps.sessionExerciseRepo.update({ ...bag, setTargets });
    for (const log of logs) {
      await deps.roundLogRepo.create({
        id: `round-${log.roundNumber}`,
        sessionExerciseId: 'sx-bag',
        exerciseId: HEAVY_BAG.id,
        restSkipped: false,
        completed: true,
        completedAt: '2026-09-01T10:00:00.000Z',
        ...log,
      });
    }
    return extractSourceWeek({ sourceMesoId: SOURCE_ID, sourceWeekNumber: 1 }, deps);
  }

  const timed = (count: number, workSec: number, restSec: number) =>
    Array.from({ length: count }, (_, index) => ({
      setNumber: index + 1,
      targetWorkSec: workSec,
      targetRestSec: restSec,
    }));

  test('rounds, work and rest come from the week, Get ready and the lever from the cycle', async () => {
    const deps = makeDeps();
    // The cycle says 5 × 2:00 / 0:30; the week, after its progression, ran 3 × 2:00 / 0:20.
    const week = await seedBag(deps, timed(3, 120, 20), [
      { roundNumber: 1, workSec: 120, restSec: 20 },
      { roundNumber: 2, workSec: 120, restSec: 20 },
      { roundNumber: 3, workSec: 120, restSec: 20 },
    ]);

    expect(week.exerciseSettings[HEAVY_BAG.id]).toEqual({
      ...SOURCE_SETTINGS![HEAVY_BAG.id],
      rounds: 3,
      workSec: 120,
      restSec: 20,
    });
  });

  test('rounds with different times: the last round’s', async () => {
    const deps = makeDeps();
    const week = await seedBag(
      deps,
      [
        ...timed(1, 120, 45),
        ...timed(2, 90, 30).map((round, index) => ({ ...round, setNumber: index + 2 })),
      ],
      [],
    );

    expect(week.exerciseSettings[HEAVY_BAG.id]).toMatchObject({
      rounds: 3,
      workSec: 90,
      restSec: 30,
    });
  });

  test('a skipped rest and a round ended early keep their planned times', async () => {
    const deps = makeDeps();
    const week = await seedBag(deps, timed(2, 120, 20), [
      { roundNumber: 1, workSec: 120, restSec: 20 },
      { roundNumber: 2, workSec: 40, restSec: 3, restSkipped: true, completed: false },
    ]);

    expect(week.exerciseSettings[HEAVY_BAG.id]).toMatchObject({
      rounds: 2,
      workSec: 120,
      restSec: 20,
    });
  });

  test('Start lays week 1 out from them, with no step', async () => {
    const deps = makeDeps();
    const week = await seedBag(deps, timed(4, 120, 20), []);
    const source = (await deps.mesocycleRepo.getById(SOURCE_ID))!;
    const draft = toCopiedMesoBuilderDraft(source, week.weekPlan, 1, week.exerciseSettings);
    const saved = await confirmCopyWeekMesocycleDraft(toCopyWeekMesocycleConfirmInput(draft), deps);

    await startMesocycle(
      saved.id,
      { store: createSqliteMesocycleStartStore(db()) },
      '2026-10-26T09:00:00.000Z',
    );

    const [session] = await deps.sessionRepo.listByMesoId(saved.id);
    const exercises = await deps.sessionExerciseRepo.listBySessionId(session!.id);
    expect(exercises.find((exercise) => exercise.exerciseId === HEAVY_BAG.id)?.setTargets).toEqual(
      timed(4, 120, 20),
    );
  });
});

describe('Flow B: settings come from the library (GT-159)', () => {
  test('a template with hybrid exercises fills the draft with their library defaults', async () => {
    const deps = makeDeps();
    await seedHybridLibrary(deps);
    await deps.templateRepo.create({
      id: 'template-hybrid',
      name: 'Hybrid',
      source: 'custom',
      isHidden: false,
      weekPlan: {
        days: [
          {
            dayNumber: 1,
            name: '',
            exercises: [
              { exerciseId: HEAVY_BAG.id, order: 1, sets: 2 },
              { exerciseId: COOLDOWN.id, order: 2, sets: 2 },
            ],
          },
        ],
      },
    });

    const draft = toTemplateMesoBuilderDraft(await prepareTemplateDraft('template-hybrid', deps));

    expect(draft.exerciseSettings).toEqual({
      [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, rounds: DEFAULT_INTERVAL_ROUNDS },
      [COOLDOWN.id]: COOLDOWN.config,
    });
  });
});
