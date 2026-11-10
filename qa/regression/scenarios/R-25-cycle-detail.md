# R-25 · Cycle detail and history mode

Priority: P1 · Spec: 08.9, 06 · Where: Simulator

Precondition: a completed or stopped cycle with logged workouts; for step 5, an active cycle.

## Steps

1. On the Cycles tab tap a completed cycle's row.
2. Look at the summary.
3. Tap a done day in the workout grid.
4. Go back; tap a day the cycle never reached (stopped cycles only).
5. On an active cycle open header ⋯ → "Cycle history".

## Expect

- Step 2: tiles for workouts, sets (strength only) and weeks; weekly volume tables per exercise
  type; a workout grid.
- Step 3: the day opens in history mode: logged values, no grid button, no header ⋯, no next
  workout.
- Step 4: days that were never done can't be opened.
- Step 5: the summary only, without the workout grid.
