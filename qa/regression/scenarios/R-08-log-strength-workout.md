# R-08 · Log a strength workout and finish it

Priority: P0 · Spec: 05, 08.7 · Where: Simulator

Precondition: cycle A active, Week 1 Day 1 not started (chain step 3: right after R-07, which lands
on the Workout tab with the first-workout tour already closed).

A set is logged by tapping the empty square in its Log column; tapping the ✓ there unlogs it.

## Steps

1. On the Workout tab, Week 1 Day 1 is open.
2. On the first exercise ("Lateral Raise"), set 1: type 10 into the weight field and 12 into the
   reps field, tap the square in the Log column.
3. Close the rest coachmark that appears after the first log ("Not now").
4. Set 2: check the weight field, type 12 into reps, tap its Log square.
5. Tap set 2's ✓.
6. Log set 2 once more with 12 reps.
7. Log every remaining set of every exercise on the day: any weight, any reps.
   - "Pull Up" asks for body weight once per cycle: type 80, save.
   - "Dips Chest Focused Weighted" takes the added weight in its own column: type 10.
8. If the rest bar or banner covers the bottom of the list, close it with ×. Tap "Finish workout".
9. In the summary tap "Next workout".
10. Open the week grid (⊞ in the header), wait for it to settle, tap Week 1 Day 1.

## Expect

- Step 1: the header shows Week 1 Day 1; every exercise shows only an RIR pill (RIR 2) and the
  reps fields are empty ("–") — week 1 of a template cycle has no history to compute from.
- Step 2: set 1 shows ✓; the header gains today's date and a progress bar — the workout is in
  progress.
- Step 2: the weight 10 carries down to the later sets of the exercise as soon as it is typed.
- Step 5: set 2 is editable again and keeps 10 / 12.
- Step 7: until every exercise is logged or skipped, "Finish workout" is disabled, with a hint
  under it saying why.
- Step 8: no confirmation; a summary for Day 1 — 7 exercises, 16 sets — says progression was
  added to next week's Day 1 and names Day 2 as next. Its only way out is "Next workout"; the
  scrim does nothing, by design.
- Step 9: Week 1 Day 2 opens.
- Step 10: the grid marks Week 1 Day 1 as done. The day opens read-only: a ✓ beside the title, no
  per-exercise ⋯ or ⓘ, plain values, tapping a ✓ does nothing, and "Next workout" at the bottom.

## Manual only

- The rest timer that starts after each log is R-09; sound and vibration are D-03.
