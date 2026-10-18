// Progression policy for `interval` exercises — 10 · Hybrid Exercises, "Interval: рычаги
// прогрессии". An interval exercise's unit is the round, not a set of reps, and what it progresses
// on is a lever chosen per exercise (`rest`, `workTime`, `rounds`, `none`): every round done → step
// the lever, else repeat the plan. That rule is GT-100; until it lands the policy runs strength's
// as the type did before the engine dispatched by type, so behaviour doesn't change under it.
//
// It has a file of its own on purpose: what an interval does for each of the policy's four jobs —
// the next working week, a deload day, rule 6 and a copied block's start — is replaced here one by
// one, exactly as power's was, without a branch on the type anywhere else.

import type { ProgressionPolicy } from '@domain/progressionPolicy';
import { strengthPolicy } from '@domain/progressionPolicyStrength';

export const intervalPolicy: ProgressionPolicy = {
  prescribeWorkingWeek: strengthPolicy.prescribeWorkingWeek,
  prescribeDeload: strengthPolicy.prescribeDeload,
  prescribeFromReference: strengthPolicy.prescribeFromReference,
  prescribeBlockStart: strengthPolicy.prescribeBlockStart,
};
