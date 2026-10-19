// GT-160 end to end, over SQLite: a cycle that mixes strength, power, interval and mobility goes
// from the editor's draft through Confirm to Start, and week 1 opens with every type's own rows —
// interval rounds and the mobility block timed from the cycle's settings, not the library's.

import { addExercisesToDraft, withDraftExerciseSettings } from '@components/MesoEditorScreenLogic';
import { toExerciseId } from '@domain/catalog';
import { DEFAULT_MESO_BUILDER_DRAFT, toScratchMesocycleDraftInput } from '@state/draftStore';
import { SqliteExerciseRepository } from '@storage/sqlite/exerciseRepository';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { createSqliteMesocycleStartStore } from '@storage/sqlite/mesocycleStartStore';
import { SqliteSessionRepository } from '@storage/sqlite/session';
import { SqliteSessionExerciseRepository } from '@storage/sqlite/sessionExercise';
import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import { confirmScratchMesocycleDraft } from '@usecases/mesocycleCreation';
import { startMesocycle } from '@usecases/mesocycleStart';
import { COOLDOWN, HEAVY_BAG, HEAVY_BAG_CONFIG, MEDBALL_THROW } from '../fixtures/hybridExercises';
import { seedReferences } from '../fixtures/references';
import { withTestDatabase } from '../fixtures/sqliteDatabase';

const db = withTestDatabase();

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

const BENCH = 'bench';

test('a mixed cycle goes through Confirm → Start and week 1 has every type’s own rows (GT-160)', async () => {
  const store = db();
  const exerciseRepo = new SqliteExerciseRepository(store);
  for (const exercise of [MEDBALL_THROW, HEAVY_BAG, COOLDOWN]) {
    await exerciseRepo.createCustom(exercise);
  }
  await seedReferences(store, { exerciseIds: [BENCH] });
  const bench = (await exerciseRepo.getById(toExerciseId(BENCH)))!;

  // The editor: four exercises on day 1, and the heavy bag's plan changed in the plan sheet.
  let draft = addExercisesToDraft(
    { ...DEFAULT_MESO_BUILDER_DRAFT, name: 'Hybrid' },
    1,
    [bench.id, MEDBALL_THROW.id, HEAVY_BAG.id, COOLDOWN.id],
    { [bench.id]: bench, [MEDBALL_THROW.id]: MEDBALL_THROW, [HEAVY_BAG.id]: HEAVY_BAG, [COOLDOWN.id]: COOLDOWN },
  );
  draft = withDraftExerciseSettings(draft, HEAVY_BAG.id, { ...HEAVY_BAG_CONFIG, restSec: 30, rounds: 4 });

  const saved = await confirmScratchMesocycleDraft(toScratchMesocycleDraftInput(draft), {
    mesocycleRepo: new SqliteMesocycleRepository(store),
    settingsRepo: new SqliteSettingsRepository(store),
  });
  await startMesocycle(saved.id, { store: createSqliteMesocycleStartStore(store) }, '2026-10-18T09:00:00.000Z');

  const [session] = await new SqliteSessionRepository(store).listByMesoId(saved.id);
  const rows = new Map(
    (await new SqliteSessionExerciseRepository(store).listBySessionId(session!.id)).map((exercise) => [
      exercise.exerciseId,
      exercise,
    ]),
  );

  expect(rows.get(BENCH)?.setTargets).toHaveLength(2);
  expect(rows.get(MEDBALL_THROW.id)?.setTargets).toHaveLength(2);
  expect(rows.get(HEAVY_BAG.id)?.setTargets).toEqual([
    { setNumber: 1, targetWorkSec: 120, targetRestSec: 30 },
    { setNumber: 2, targetWorkSec: 120, targetRestSec: 30 },
    { setNumber: 3, targetWorkSec: 120, targetRestSec: 30 },
    { setNumber: 4, targetWorkSec: 120, targetRestSec: 30 },
  ]);
  expect(rows.get(COOLDOWN.id)?.setTargets).toEqual([{ setNumber: 1, targetWorkSec: 600 }]);
  const rirs = new Set([...rows.values()].map((exercise) => exercise.targetRir));
  expect(rirs.size).toBe(1);
});
