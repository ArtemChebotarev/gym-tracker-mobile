# R-17 · Mobility block

Priority: P1 · Spec: 08.7, 05 · Where: Simulator

Precondition: cycle A active, Day 2 of a week open, the previous week's Day 2 done
(not skipped — otherwise nothing is prefilled); "Cooldown" not logged.

## Steps

1. Look at "Cooldown".
2. Change its duration.
3. Tap "Start timer" and let it run to the end.
4. On another week's Day 2 tap the Cooldown's Log square instead.

## Expect

- Step 1: a single duration row with a Log square and "Start timer"; no sets stepper, no RIR.
- Step 2: the new duration is kept.
- Step 3: the timer runs get ready, then one round with no rest, then a summary; the block shows
  as logged with its duration.
- Step 4: the block logs with its duration without the timer.
