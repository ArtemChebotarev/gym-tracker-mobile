# R-12 · Header ⋯ menu

Priority: P1 · Spec: 08.7, 03 · Where: Simulator

Precondition: cycle A active, a working-week day open and not started; another day of cycle A
already has a strength exercise logged that this day doesn't have (in the chain: Day 1 logged in
R-08, Day 2 open).

## Steps

1. Open the header ⋯.
2. Tap "Add exercise", pick the strength exercise logged on the other day.
3. Header ⋯ → "Rename cycle", type a new name, save.
4. Header ⋯ → "Cycle history", then go back.
5. Log one exercise fully. Header ⋯ → "Skip workout", confirm.
6. Open the ⊞ grid.

## Expect

- Step 1: the menu has add exercise, skip workout, rename cycle, cycle history and stop cycle.
- Step 2: one exercise is added at the end of the day (one at a time, not a multi-select). Its sets
  come prefilled from the other day: the weight logged there and an approximate reps target
  ("~N"), with a note under the sets that the numbers are an estimate from previous activity —
  not empty fields. (Same unit as the cycle; R-33 checks the other unit gives nothing.)
- Step 3: the new name shows in the header and on the Cycles tab.
- Step 4: the cycle's summary opens; for an active cycle it has no workout grid.
- Step 5: the summary lists the logged exercise with its sets and the others as skipped; with
  something logged the day counts as done (a day with no logs at all counts as skipped). The day
  is read-only (check it from the ⊞ grid: the summary closes only into the next workout).
- Step 6: the day shows as skipped; the ring moves to the next day to do.
