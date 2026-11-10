# R-22 · Last workout → Finish cycle

Priority: P0 · Spec: 04, 08.3 · Where: Simulator

Precondition: cycle A active, every workout done except Week 4 Day 2.

## Steps

1. Open Week 4 Day 2, log and finish it.
2. In the summary tap "Finish cycle", then "Cancel" in the confirmation.
3. Open the Workout tab, tap "Finish cycle" there, then "Finish".
4. Open the Cycles tab.

## Expect

- Step 1: the summary reads "Cycle done", "4 weeks · 8 of 8 workouts", "Your next cycle can start
  from where this one ended.", with "Finish cycle" instead of "Next workout".
- Step 2: the confirmation reads "Finish training cycle?" — "Every workout is done. The cycle moves
  to Completed — you can start the next one from any of its weeks." — "Cancel" / "Finish". After
  Cancel the cycle is still active: it does not finish by itself.
- Step 3: the Workout tab shows "Training cycle complete" — "Every workout is done. Finish it to
  move it to Completed." — with "Finish cycle". After "Finish" the cycle moves to Completed.
- Step 4: cycle A is listed under Completed as "4 weeks · {start} – {end}"; there is no Active
  section. The Workout tab shows "Your next cycle is ready" with "Go to Cycles" while a planned
  cycle exists ("Scratch test" from R-04), otherwise "Start your next training cycle".
- The "+" sheet now has "Copy a cycle" enabled (the start of R-05).
