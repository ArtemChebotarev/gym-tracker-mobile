# R-07 · Start a cycle

Priority: P0 · Spec: 08.3 · Where: Simulator

Two parts, at two points of the chain.

## Part 1 — start the first cycle

Precondition: cycle A planned, nothing active (chain step 2, right after R-03).

1. On the Cycles tab tap the "Start" pill on cycle A.
2. Tap "Start" in the confirmation.
3. Go through the tour on the Workout tab: "Next" on each step, "Got it" on the last.

### Expect

- Step 1: a start confirmation with a short summary of the cycle, a cancel option and "Start".
- Step 2: the app switches to the Workout tab on Week 1 Day 1, and a three-step tour opens.
- Afterwards the Cycles tab lists cycle A in the active section, with an active badge, week 1 of 4
  and today's start date.

## Part 2 — a second cycle can't start

Precondition: cycle A active, cycle "Scratch test" planned (chain step 4, right after R-04).

1. On the Cycles tab tap the "Start" pill on "Scratch test".

### Expect

- Instead of the start confirmation, a popup says another cycle (naming A) is still active, with
  a single "OK". Nothing changes: A stays active, "Scratch test" stays planned.
