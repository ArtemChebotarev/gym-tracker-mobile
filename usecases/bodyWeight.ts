// The block's body weight — task 105 (05 · Workout Execution & Logging, "Ввод веса и повторов").
// It's asked for the first time a bodyweight exercise comes up in a mesocycle and then fills every
// later one, so it isn't retyped set after set.
//
// Only the mesocycle changes here. Sets already logged keep what they were logged with — a
// `bodyweight-weighted` set stores its own `bodyWeight`, and a pure bodyweight set stores the
// weight itself — so a new value moves only the sets still to come ("История неизменяема").

import { NotFoundError } from '@domain/errors';
import type { Mesocycle } from '@domain/mesocycle';
import type { MesocycleRepository } from '@repositories/mesocycle';

export type BodyWeightInput = {
  mesoId: string;
  /** Kilograms. Must be a finite number above 0 — a body weight of 0 is not a body weight. */
  bodyWeight: number;
};

export async function setBodyWeight(
  input: BodyWeightInput,
  mesocycleRepo: MesocycleRepository,
): Promise<Mesocycle> {
  if (!Number.isFinite(input.bodyWeight) || input.bodyWeight <= 0) {
    throw new Error(`Body weight must be a finite number above 0, got ${input.bodyWeight}.`);
  }
  const mesocycle = await mesocycleRepo.getById(input.mesoId);
  if (!mesocycle) {
    throw new NotFoundError(`Mesocycle "${input.mesoId}" does not exist.`);
  }
  return mesocycleRepo.update({ ...mesocycle, bodyWeight: input.bodyWeight });
}
