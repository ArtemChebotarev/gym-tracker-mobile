// GT-159 end to end, over SQLite (Artem, 18.10.2026): a copied week (Flow C) opens the editor
// with the settings its power, interval and mobility exercises ran with in the source cycle,
// library defaults for one the source has none for; a template (Flow B) gives library defaults.

import type { Session, SessionExercise } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import type { Unsaved } from '@domain/timestamps';
import {
  toCopiedMesoBuilderDraft,
  toCopyWeekMesocycleConfirmInput,
  toTemplateMesoBuilderDraft,
} from '@state/draftStore';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { SqliteSessionRepository } from '@storage/sqlite/session';
import { SqliteSessionExerciseRepository } from '@storage/sqlite/sessionExercise';
import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import { SqliteTemplateRepository } from '@storage/sqlite/template';
import {
  confirmCopyWeekMesocycleDraft,
  extractSourceWeek,
  prepareTemplateDraft,
} from '@usecases/mesocycleCreation';
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
    settingsRepo: new SqliteSettingsRepository(store),
    templateRepo: new SqliteTemplateRepository(store),
  };
}

const SOURCE_ID = 'meso-source';

// What the source cycle ran with: both edited away from the library. Cooldown has no entry — a
// cycle saved before the cycle kept its own settings.
const SOURCE_SETTINGS: Mesocycle['exerciseSettings'] = {
  [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG, lever: 'none' },
  [MEDBALL_THROW.id]: { type: 'power', load: 'weight', noHeavierAvailable: true },
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

    expect((await deps.mesocycleRepo.getById(saved.id))?.exerciseSettings).toEqual(draft.exerciseSettings);
    expect((await deps.mesocycleRepo.getById(SOURCE_ID))?.exerciseSettings).toEqual(SOURCE_SETTINGS);
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
      [HEAVY_BAG.id]: { ...HEAVY_BAG_CONFIG },
      [COOLDOWN.id]: COOLDOWN.config,
    });
  });
});
