// GT-158 end to end, over SQLite: a hybrid exercise added in the editor gives the draft a copy of
// its library config; Confirm saves the copy with the cycle; editing one cycle's copy moves
// neither the library exercise nor another cycle that uses it.

import { addExercisesToDraft } from '@components/MesoEditorScreenLogic';
import type { IntervalConfig } from '@domain/exerciseConfig';
import {
  DEFAULT_MESO_BUILDER_DRAFT,
  toMesoBuilderDraft,
  toScratchMesocycleDraftInput,
} from '@state/draftStore';
import { SqliteMesocycleRepository } from '@storage/sqlite/mesocycle';
import { SqliteSettingsRepository } from '@storage/sqlite/settings';
import { confirmScratchMesocycleDraft } from '@usecases/mesocycleCreation';
import { editPlannedMesocycle } from '@usecases/mesocycleEditing';
import { HEAVY_BAG } from '../fixtures/hybridExercises';
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
    settingsRepo: new SqliteSettingsRepository(store),
  };
}

function draftWithHeavyBag(name: string) {
  return addExercisesToDraft({ ...DEFAULT_MESO_BUILDER_DRAFT, name }, 1, [HEAVY_BAG.id], {
    [HEAVY_BAG.id]: HEAVY_BAG,
  });
}

describe('a cycle’s own exercise settings (GT-158)', () => {
  test('Confirm saves the copy made when the exercise was added', async () => {
    const deps = makeDeps();

    const saved = await confirmScratchMesocycleDraft(
      toScratchMesocycleDraftInput(draftWithHeavyBag('Hybrid')),
      deps,
    );

    const stored = await deps.mesocycleRepo.getById(saved.id);
    expect(stored?.exerciseSettings).toEqual({
      [HEAVY_BAG.id]: { ...HEAVY_BAG.config },
    });
  });

  test('editing one cycle’s copy leaves the library and the other cycle as they were', async () => {
    const deps = makeDeps();
    const libraryConfig = structuredClone(HEAVY_BAG.config);
    const first = await confirmScratchMesocycleDraft(
      toScratchMesocycleDraftInput(draftWithHeavyBag('First')),
      deps,
    );
    const second = await confirmScratchMesocycleDraft(
      toScratchMesocycleDraftInput(draftWithHeavyBag('Second')),
      deps,
    );

    const draft = toMesoBuilderDraft((await deps.mesocycleRepo.getById(first.id))!);
    const bag = draft.exerciseSettings?.[HEAVY_BAG.id] as IntervalConfig;
    await editPlannedMesocycle(
      first.id,
      toScratchMesocycleDraftInput({
        ...draft,
        exerciseSettings: { [HEAVY_BAG.id]: { ...bag, lever: 'none' } },
      }),
      deps,
    );

    expect((await deps.mesocycleRepo.getById(first.id))?.exerciseSettings?.[HEAVY_BAG.id]).toMatchObject({
      lever: 'none',
    });
    expect((await deps.mesocycleRepo.getById(second.id))?.exerciseSettings).toEqual({
      [HEAVY_BAG.id]: { ...libraryConfig },
    });
    expect(HEAVY_BAG.config).toEqual(libraryConfig);
  });
});
