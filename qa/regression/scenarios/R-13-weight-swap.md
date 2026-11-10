# R-13 · A different weight: reps recalculated

Priority: P1 · Spec: 08.7.1 · Where: Simulator

Precondition: cycle A active, week 2 or later, a strength day not started (the sets have reps
targets and weights prefilled).

## Steps

1. On the first strength exercise tap the ⓘ by the weight column.
2. On set 1 change the weight to a little more than prefilled (e.g. +2.5 kg) and leave the field.
3. Change it to much more (e.g. double).
4. Change it to much less (e.g. a quarter).
5. Put the prefilled weight back.

## Expect

- Step 1: a popover shows the weight ranges for this exercise.
- Step 2: the reps target of that set is recalculated for the new weight; an estimated value is
  shown as approximate ("~N") with a short note, and no hit indicator.
- Steps 3 and 4: out of range, the reps target becomes empty ("–") with a note saying the weight
  is too heavy or too light; Log then needs reps typed by hand.
- Step 5: the original target comes back.
