// Flow C for `power` — week 1's rows of a copied block. See 10.2 · Power progression (P14) and 04 ·
// Meso Creation Flows, "Расчёт startReps". The same sum as strength's, `reference + 1` minus the gap
// between the new block's RIR and the reference's, unclamped, and a result of 0 or less is no
// recommendation — the row stays bare instead of being lifted to a minimum nobody asked for.

import type { Equipment } from '@domain/catalog';
import type { SetTarget } from '@domain/execution';
import type { ReferenceResolution } from '@domain/progression';
import { prescribeBlockStart } from '@domain/progressionStartReps';

/**
 * `rowCount` rows priced as strength's block start (`prescribeBlockStart`): `startTargetReps` with
 * no clamp, the reference weight as is, marked as an estimate when the resolver says so, no weight
 * hint, and no numbers for a row with no reference set or a sum of 0 or less. Since GT-163 strength
 * clamps nothing either, so the two are one sum; this name stays for power's policy to read as its
 * own rule (10.2 P14).
 */
export function prescribePowerBlockStart(
  resolution: ReferenceResolution,
  startRir: number,
  rowCount: number,
  equipment?: Equipment,
): SetTarget[] {
  return prescribeBlockStart(resolution, startRir, rowCount, equipment);
}
