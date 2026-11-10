# R-07 · Start a cycle

Priority: P0 · Spec: 08.3 · Where: Simulator

Two parts, at two points of the chain.

## Part 1 — start the first cycle

Precondition: cycle A planned, nothing active (chain step 2, right after R-03).

1. On the Cycles tab tap the "Start" pill on cycle A.
2. Tap "Start" in the confirmation.
3. Go through the tour on the Workout tab: "Next" on each step, "Got it" on the last.

### Expect

- Step 1: a dialog "Start this training cycle?" with a short summary of the cycle, a cancel
  option and "Start".
- Step 2: the app switches to the Workout tab on "Week 1 Day 1", and a tour opens: step "1 of 3",
  "Not sure about the load?".
- Afterwards the Cycles tab lists cycle A under "Active", with an "Active" badge and "Week 1 of 4
  · started {today}".

## Part 2 — a second cycle can't start

Precondition: cycle A active, cycle "Scratch test" planned (chain step 4, right after R-04).

1. On the Cycles tab tap the "Start" pill on "Scratch test".

### Expect

- Instead of the start confirmation, a popup "Can't start yet": "Upper / Lower + Boxing Hybrid"
  is still active. Finish or stop it before starting another cycle. One button, "OK". Nothing
  changes: A stays active, "Scratch test" stays planned.
