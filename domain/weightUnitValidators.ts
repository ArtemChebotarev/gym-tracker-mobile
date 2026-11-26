// What a weight unit may be (GT-269) — see `weightUnit.ts`.

import { WEIGHT_UNITS, type WeightUnit } from './weightUnit';

/** Throws unless `value` is one of `WEIGHT_UNITS`. */
export function assertWeightUnit(value: unknown): asserts value is WeightUnit {
  if (!WEIGHT_UNITS.includes(value as WeightUnit)) {
    throw new Error(`Weight unit must be one of ${WEIGHT_UNITS.join(', ')}, got ${String(value)}.`);
  }
}
