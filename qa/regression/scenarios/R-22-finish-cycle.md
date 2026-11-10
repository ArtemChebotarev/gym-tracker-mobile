# R-22 · Last workout → Finish cycle

Priority: P0 · Spec: 04, 08.3 · Where: Simulator

Precondition: cycle A active, every workout done except Week 4 Day 2.

## Steps

1. Open Week 4 Day 2, log and finish it.
2. In the summary tap "Finish cycle", then "Cancel" in the confirmation.
3. Open the Workout tab, tap "Finish cycle" there, then confirm.
4. Open the Cycles tab.

## Expect

- Step 1: the summary is the cycle-done variant — 4 weeks, 8 of 8 workouts — with "Finish cycle"
  instead of "Next workout".
- Step 2: a confirmation with "Cancel" and a confirm button. After Cancel the cycle is still
  active: it does not finish by itself.
- Step 3: the Workout tab shows the cycle-complete empty state with "Finish cycle". After
  confirming, the cycle moves to Completed.
- Step 4: cycle A is in the completed section with its length and dates; there is no active
  section. The Workout tab shows the planned-cycle empty state while "Scratch test" from R-04 is
  planned, otherwise the first-or-next-cycle one.
- The "+" sheet now has "Copy a cycle" enabled (the start of R-05).
