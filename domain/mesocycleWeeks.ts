// Which week of a block is which — 02 · Domain Model, "Mesocycle": "Deload is always the block's
// last week — there is no separate `deloadWeek` field." Kept separate from `domain/mesocycle.ts`
// (types only) per the single-responsibility rule in AGENTS.md, and separate from
// `domain/mesocycleLifecycle.ts`, which is about how a block ends rather than how it is laid out.
//
// A leaf on purpose: it imports nothing. The progression engine, the grid, the workout screen and
// the Flow C source-week check all ask the same question, and routing it through any of them puts
// a cycle in the graph — which is exactly what happened when `mesocycleValidators` reached into
// `progressionPlan` for it (task 041): validators → progressionPlan → progressionRir →
// validators, and Metro said so on every bundle.

/**
 * Whether week `weekNumber` (1-based) of a `lengthWeeks`-week block is its deload week — i.e. its
 * last. `lengthWeeks` is not re-validated here: it is checked where a mesocycle is built
 * (`validateMesocycleLengthWeeks`), and a predicate that throws is a predicate callers have to
 * guard before asking.
 */
export function isDeloadWeek(lengthWeeks: number, weekNumber: number): boolean {
  return weekNumber === lengthWeeks;
}
