# R-33 · Weight unit: kg and lb side by side

Priority: P0 · Spec: 08, 08.5, 08.6, 08.7, 03, 04 · Where: Simulator

Precondition: cycle A completed (in the chain: step 9), nothing active. Below, *the chain's unit*
is the one cycle A was created in (kg, or lb on a run in lb) and *the other unit* is the other one.
"Lateral Raise" stands for any strength exercise logged in cycle A.

## Steps

1. Settings: look at the weight unit, then pick the other unit.
2. Cycles → "+" → "From scratch" → "Next". On the first step look at the weight unit, set days per
   week to 1, name it "Unit test", "Continue". Add "Lateral Raise" to Day 1, "Continue", "Save
   cycle".
3. Tap the planned "Unit test" row to open its editor; on the first step pick the chain's unit, then
   the other unit again, and save.
4. Start "Unit test" and open its Week 1 Day 1.
5. Header ⋯ → "Add exercise" → add another exercise logged in cycle A in the last 30 days, one
   lifted with a weight (not a bodyweight, band or power-level one).
6. Skip the added exercise. Log every set of "Lateral Raise" with weight 25 and reps 10, then
   "Finish workout" and close the summary.
7. In the finished workout tap "Lateral Raise"'s name; then open the history tab.
8. Go to the Library tab and find "Lateral Raise".
9. Settings: pick the chain's unit back. On the Workout tab, header ⋯ → "Stop cycle" (type END
   CYCLE).

## Expect

- Step 1: the chain's unit is selected; a note under it says new cycles start in this unit.
- Step 2: the first step shows the weight unit with the other unit selected.
- Step 3: after saving, the editor opens on the other unit again.
- Step 4: every column header of the day names the other unit (e.g. "Weight, lb").
- Step 5: the added exercise has no reps target, no prefilled weight and no estimate note — its
  history is in the chain's unit, which is no reference here. (In the chain's unit the same
  exercise would come with an estimate from cycle A. A bodyweight, band or power-level exercise
  would come with one in either unit: its logs hold no weight in a unit.)
- Step 6: the summary's best set reads 25 × 10 in the other unit (e.g. "25 lb × 10").
- Step 7: the overview's Best set is 25 × 10 with the other unit — the set just logged — whatever
  weights cycle A logged. The history tab's "Unit test" section shows 25 × 10 in the other unit;
  cycle A's sections show their sets in the chain's unit, the numbers exactly as logged.
- Step 8: the row's caption names 25 × 10 in the other unit.
- Step 9: "Unit test" leaves the active section; cycle A and its history are unchanged.
