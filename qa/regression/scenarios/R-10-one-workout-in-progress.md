# R-10 · Only one workout in progress

Priority: P1 · Spec: 05 · Where: Simulator

Precondition: cycle A active, a workout in progress (one set logged), another day of the same week
not started.

## Steps

1. Open the ⊞ grid and open the other, not started day.
2. Try to log a set there.
3. Use the alert's button to go back to the workout in progress.

## Expect

- Step 1: the other day opens normally; it can be looked at.
- Step 2: the set is not logged; an alert says to finish the workout in progress first, naming
  its week and day, with a button to open it.
- Step 3: the workout in progress opens, unchanged.
