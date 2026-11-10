# R-04 · Flow A: cycle from scratch

Priority: P0 · Spec: 08.5, 04 · Where: Simulator

Precondition: cycle A active, no planned cycle (chain step 4).

## Steps

1. Open the Cycles tab, tap the "+" in the header.
2. In the new-cycle sheet tap "From scratch", then "Next".
3. On the first step type "Scratch test" as the name, leave 4 weeks, set days per week to 2,
   tap "Continue".
4. On the days step, without adding anything, look at "Continue".
5. On Day 1 tap "Add exercise". In the picker tick two strength exercises (e.g. "Bench Press" and
   any "Lat Pulldown" variant — use the search; results carry an equipment suffix), then confirm.
6. On Day 1 tap "Add exercise" again and find one of the two exercises already added.
7. Close the picker by dragging it down slowly from its handle. On Day 2 add one exercise.
8. Tap "Continue", then on the review step tap "Save cycle".

## Expect

- Step 4: "Continue" is disabled, with a hint that every day needs an exercise.
- Step 5: both exercises appear on Day 1, each with 2 sets.
- Step 6: the exercise already in the day is marked as already added and can't be ticked.
- Step 8: the review shows 4 weeks and 2 days per week. After saving, the Cycles tab shows
  "Scratch test" in the planned section, with a "Start" pill and a ⋯, while cycle A stays in the
  active section.
