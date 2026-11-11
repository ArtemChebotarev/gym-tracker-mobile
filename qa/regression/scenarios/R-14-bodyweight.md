# R-14 · Bodyweight exercises

Priority: P1 · Spec: 05 · Where: Simulator

Precondition: a newly started cycle whose day has a plain bodyweight exercise ("Pull Up") and a
weighted one ("Dips Chest Focused Weighted"); body weight not yet given in this cycle.

## Steps

1. Log set 1 of "Pull Up".
2. Enter 80 and save.
3. On the last set of "Pull Up" replace the weight in its field with 82 and tap its Log box
   straight away, keyboard still up.
4. On "Dips Chest Focused Weighted" type 10 into the added-weight column and log a set.
5. Finish the day (skip what is left), then open Week 2 Day 1 from the week grid (⊞).

## Expect

- Step 1: a sheet asks for body weight before the set is logged.
- Step 2: saving stores the body weight but does not log the set — tap Log again; the set logs
  with 80. The sheet does not come back in this cycle.
- Step 3: for a plain bodyweight exercise, editing the weight changes the cycle's body weight —
  later bodyweight exercises show 82.
- Step 4: the weighted exercise logs body weight plus the added weight, shown as "82 (+10)".
- Step 5: no body-weight sheet; "Pull Up" shows the cycle's body weight, 82.
