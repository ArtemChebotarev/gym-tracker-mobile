// Mesocycle creation-flow use cases — task 071 (04 · Meso Creation Flows, "Сохранение при
// подтверждении (Confirm)"). Orchestrates a flow's domain builder with `MesocycleRepository`;
// contains no business logic of its own, per usecases/README.md — building the draft
// (`buildScratchMesocycleDraft`, task 038) stays in `domain/`.
//
// Only Flow A has a builder so far. Flow B (039) and Flow C will get their own sibling
// functions here once their builders exist — each the same shape: build the draft, then
// `mesocycleRepo.create` it.

import { buildScratchMesocycleDraft, type ScratchMesocycleDraftInput } from '@domain/mesocycleBuilders';
import type { Mesocycle } from '@domain/mesocycle';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { SettingsRepository } from '@repositories/settings';

export type MesocycleCreationDeps = {
  mesocycleRepo: MesocycleRepository;
  settingsRepo: SettingsRepository;
};

/**
 * Confirms a Flow A draft: builds it (fresh id, `status: 'planned'`, no `startDate`, and a snapshot
 * of the global `defaultProgressionSettings` read right now) and saves it via
 * `MesocycleRepository.create`. `Session`/`SessionExercise` are never touched — that's
 * Start's job (042), not Confirm's (04 · Meso Creation Flows, "Сохранение при подтверждении").
 *
 * Calling this again with the same `input` does not update anything: `buildScratchMesocycleDraft`
 * generates a fresh id every call, so two Confirms produce two independent `Mesocycle` records.
 */
export async function confirmScratchMesocycleDraft(
  input: ScratchMesocycleDraftInput,
  deps: MesocycleCreationDeps,
): Promise<Mesocycle> {
  const settings = await deps.settingsRepo.read();
  const draft = buildScratchMesocycleDraft(input, settings.defaultProgressionSettings);
  return deps.mesocycleRepo.create(draft);
}
