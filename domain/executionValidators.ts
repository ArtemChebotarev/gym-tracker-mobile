// What a set row has to hold before it can be logged — see 05 · Workout Execution & Logging.
// Kept separate from `domain/execution.ts` (types only) per the single-responsibility rule in
// AGENTS.md.
//
// The session invariants of 02 · Domain Model used to be restated here as validators. Task 118
// removed them: each is now held in one place and one only — the unique slot by the index in
// `storage/sqlite/schema.ts`, the single `in_progress` session by `startSessionOnFirstSet`
// (`domain/sessionLifecycle.ts`), and an `awaiting_source` session's unstartability by
// `assertSessionOpen` beside it. A second copy that nobody called could only drift from them.

/**
 * What the user entered in a set row: an empty field (only a placeholder showing) is `null`.
 * `bodyWeight` rides along on a `bodyweight-weighted` exercise — `weight` is then the added weight
 * and this is what it was added to, kept so the set still reads the same after the block's body
 * weight changes (task 105). It isn't entered and isn't validated.
 */
export type SetEntry = { weight: number | null; reps: number | null; bodyWeight?: number };

/**
 * Throws unless both fields of a set row hold a value (05 · Workout Execution & Logging, "Записать
 * подход": the placeholder isn't a value, a set can be logged only once both fields are filled).
 * `reps` must be a whole number of at least 1 and `weight` a finite number of at least 0 —
 * bodyweight work is logged at 0.
 */
export function validateSetEntry(
  entry: SetEntry,
): asserts entry is SetEntry & { weight: number; reps: number } {
  const { weight, reps } = entry;
  if (weight === null || reps === null) {
    throw new Error('A set can be logged only once both weight and reps are entered.');
  }
  if (!Number.isFinite(weight) || weight < 0) {
    throw new Error(`Weight must be a finite number of at least 0, got ${weight}.`);
  }
  if (!Number.isInteger(reps) || reps < 1) {
    throw new Error(`Reps must be a whole number of at least 1, got ${reps}.`);
  }
}
