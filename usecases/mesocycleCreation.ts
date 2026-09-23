// Mesocycle creation-flow use cases — tasks 071 and 041 (04 · Meso Creation Flows, "Сохранение
// при подтверждении (Confirm)"). Orchestrates a flow's domain builder with `MesocycleRepository`;
// contains no business logic of its own, per usecases/README.md — building the draft
// (`buildScratchMesocycleDraft`, `buildCopyWeekMesocycleDraft`) and reading a week back out of
// its sessions (`extractWeekPlan`) both stay in `domain/`.
//
// Flow B (039) will get its own sibling function here once its builder exists, the same shape as
// these: build the draft, then `mesocycleRepo.create` it.

import { NotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import {
  buildCopyWeekMesocycleDraft,
  buildScratchMesocycleDraft,
  type CopyWeekMesocycleDraftInput,
  type ScratchMesocycleDraftInput,
} from '@domain/mesocycleBuilders';
import type { WeekPlan } from '@domain/plan';
import { extractWeekPlan } from '@domain/planConverters';
import { validateCopyableSourceWeek } from '@domain/mesocycleValidators';
import type { MesocycleRepository } from '@repositories/mesocycle';
import type { SessionRepository } from '@repositories/session';
import type { SessionExerciseRepository } from '@repositories/sessionExercise';
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

export type SourceWeekDeps = {
  mesocycleRepo: MesocycleRepository;
  sessionRepo: SessionRepository;
  sessionExerciseRepo: SessionExerciseRepository;
};

/**
 * Reads week `sourceWeekNumber` of mesocycle `sourceMesoId` back as a `WeekPlan` — Flow C's
 * starting point (04 · Meso Creation Flows, "Что копируется"), which the editor prefills its
 * draft from (124).
 *
 * Structure only: days, the exercises each ended up with, their final order, and how many set
 * rows each one actually had. No logged sets, no targets, no statuses and no RIR — `extractWeekPlan`
 * has nowhere to put them.
 *
 * Rejects with `NotFoundError` if the mesocycle doesn't exist or that week has no sessions (lazy
 * generation never reached it, so there is nothing to copy), and throws on the deload week, which
 * is the one week Flow C may not start from.
 */
export async function extractSourceWeekPlan(
  query: { sourceMesoId: string; sourceWeekNumber: number },
  deps: SourceWeekDeps,
): Promise<WeekPlan> {
  const { sourceMesoId, sourceWeekNumber } = query;
  const source = await deps.mesocycleRepo.getById(sourceMesoId);
  if (!source) {
    throw new NotFoundError(`Mesocycle "${sourceMesoId}" does not exist.`);
  }
  validateCopyableSourceWeek(source, sourceWeekNumber);

  const sessions = await deps.sessionRepo.listByMesoIdAndWeekNumber(sourceMesoId, sourceWeekNumber);
  if (sessions.length === 0) {
    throw new NotFoundError(
      `Mesocycle "${sourceMesoId}" has no sessions in week ${sourceWeekNumber}.`,
    );
  }

  return extractWeekPlan(
    await Promise.all(
      sessions.map(async (session) => ({
        session,
        exercises: await deps.sessionExerciseRepo.listBySessionId(session.id),
      })),
    ),
  );
}

export type CopyWeekMesocycleConfirmInput = CopyWeekMesocycleDraftInput & {
  /** The mesocycle the `weekPlan` was copied out of — `extractSourceWeekPlan`'s `sourceMesoId`. */
  sourceMesoId: string;
};

/**
 * Confirms a Flow C draft — the same save as Flow A's, with `origin: 'copyWeek'` recording which
 * week of which mesocycle it came from. The source is read only to be checked: it must still
 * exist, and the week must not be its deload one. Nothing is copied out of it here, the editor's
 * `weekPlan` is already the extracted week (`extractSourceWeekPlan`), possibly edited since.
 *
 * Week 1's reps and weights are not computed here either — a `copyWeek` block gets them at Start,
 * from each exercise's own history (04 · Meso Creation Flows, "Расчёт startReps", task 122).
 *
 * Rejects with `NotFoundError` if the source mesocycle is gone.
 */
export async function confirmCopyWeekMesocycleDraft(
  input: CopyWeekMesocycleConfirmInput,
  deps: MesocycleCreationDeps,
): Promise<Mesocycle> {
  const source = await deps.mesocycleRepo.getById(input.sourceMesoId);
  if (!source) {
    throw new NotFoundError(`Mesocycle "${input.sourceMesoId}" does not exist.`);
  }
  const settings = await deps.settingsRepo.read();
  const draft = buildCopyWeekMesocycleDraft(input, source, settings.defaultProgressionSettings);
  return deps.mesocycleRepo.create(draft);
}
