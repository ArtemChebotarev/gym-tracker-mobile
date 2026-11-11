# R-23 · Stop a cycle

Priority: P1 · Spec: 08.3, 04 · Where: Simulator

Precondition: a cycle active with a workout in progress (at least one set logged) and later
workouts left.

## Steps

1. Header ⋯ → "Stop cycle".
2. Type something other than the confirmation phrase (the field capitalises the first letter).
3. Type the confirmation phrase shown (END CYCLE) and stop.
4. Open the Cycles tab, then the Workout tab.

## Expect

- Step 1: a sheet explains what stopping does and asks to type a phrase; the stop button is
  disabled.
- Step 2: the button stays disabled.
- Step 3: the button enables; after it the cycle is stopped.
- Step 4: the cycle is in the completed section with a stopped badge; there is no active cycle.
  The Workout tab shows the empty state for a next cycle. The workout that was in progress is kept
  as done (it had logs); nothing new was generated.
- No rest bar or rest-over banner of the stopped workout is left on screen.
