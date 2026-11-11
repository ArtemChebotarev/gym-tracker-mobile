# R-02 · First-workout tour and one-time hints

Priority: P1 · Spec: 08.11 · Where: Simulator

Precondition: a database where the welcome dialog was closed but no cycle was ever started — the
state right after R-01. (On a database that has already started a cycle the tour does not show.)

## Steps

1. Create cycle A (R-03) and start it (R-07 part 1 steps 1–2).
2. On the tour's first step tap "Next"; on the second tap "Skip".
3. Close the app completely and open it again on the same workout.
4. Log the first set of the workout.
5. Close the rest hint. Open the ⋯ of any exercise and tap "Add set".
6. Close that hint. Tap "Remove last set" on the same exercise.

## Expect

- Step 1: after Start, the Workout tab opens with a three-step tour pointing at, in turn, the load
  ⓘ, the RIR pill and the ⊞ grid button. A step whose target is not on screen waits for a later
  workout.
- Step 2: "Skip" ends the whole tour, not just the step.
- Step 3: the tour does not come back.
- Step 4: a one-time rest hint appears, with a way to turn on notifications and a "not now".
- Step 5: a one-time hint explains that edits carry to next week.
- Step 6: no hint this time.
- None of these hints comes back after a relaunch.
