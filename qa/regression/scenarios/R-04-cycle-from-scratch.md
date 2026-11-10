# R-04 · Flow A: cycle from scratch

Priority: P0 · Spec: 08.5, 04 · Where: Simulator

Precondition: cycle A active, no planned cycle (chain step 4).

## Steps

1. Open the Cycles tab (titled "Training cycles"), tap the "+" in the header.
2. In the "New cycle" sheet tap "From scratch", then "Next".
3. On the Basics step type "Scratch test" as the name, leave 4 weeks, set days per week to 2,
   tap "Continue".
4. On the days step, without adding anything, look at "Continue".
5. On Day 1 tap "Add exercise". In the picker tap the checkboxes of two strength exercises (e.g.
   "Bench Press" and any "Lat Pulldown" variant — use the search; results carry an equipment
   suffix such as "· Cable"), then confirm the selection.
6. On Day 1 tap "Add exercise" again and find one of the two exercises already added.
7. Close the picker by dragging it down slowly from its handle. On Day 2 add one exercise.
8. Tap "Continue", then on the Review step tap "Save cycle".

## Expect

- Step 4: "Continue" is disabled, with "Every day needs at least one exercise".
- Step 5: both exercises appear on Day 1, each with "2 sets".
- Step 6: the exercise already in the day is marked "Already in this day" and its checkbox does nothing.
- Step 8: Review reads "4 weeks · 2 days per week". After saving, the Cycles tab shows "Scratch
  test" under "Planned" — "4 weeks · 2 days/week", a "Start" pill and a ⋯ —
  while cycle A stays under "Active".
