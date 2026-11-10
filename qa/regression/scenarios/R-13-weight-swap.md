# R-13 · A different weight: reps recalculated

Priority: P1 · Spec: 08.7.1 · Where: Simulator

Precondition: cycle A active, week 2 or later, a strength day not started (the sets have reps
targets and weights prefilled).

## Steps

1. On the first strength exercise tap the ⓘ by the weight column.
2. On set 1 change the weight by less than 20% of the prefilled one (e.g. 10 → 11 kg) and leave
   the field.
3. Change it by more than 20% but still inside the full range the ⓘ showed (e.g. 10 → 13 kg).
4. Change it to much more than the range (e.g. double).
5. Change it to much less (e.g. a quarter).
6. Put the prefilled weight back.

## Expect

- Step 1: a popover shows the weight ranges for this exercise.
- A changed weight carries to every unlogged set of the exercise.
- Step 2: the reps target is recalculated and looks like an ordinary target — no "~", no note.
  Within 20% the app is confident in the number (03, rule 7).
- Step 3: the target is shown as approximate ("~N") with a note under the sets; logging it gives
  no hit indicator.
- Steps 4 and 5: out of range, the reps target becomes empty ("–") with a note saying the weight
  is too heavy or too light; Log then needs reps typed by hand.
- Step 6: the original target comes back.
