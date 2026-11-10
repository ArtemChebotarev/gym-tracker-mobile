# R-05 · Flow C: copy a finished cycle

Priority: P0 · Spec: 08.8, 04 · Where: Simulator

Precondition: cycle A completed (after R-22), nothing active; a planned "Scratch test" from R-04
does not matter.

## Steps

1. On the Cycles tab tap the "+" in the header, tap "Copy a cycle", then "Next".
2. On the source-week step look at what is selected; then open the week dropdown.
3. Keep the defaults and tap "Continue" through the name/length/days step and the days & exercises
   step to the review, and tap "Save cycle".
4. Start the new cycle (R-07 part 1 steps 1–2).
5. Look at Week 1 Day 1.

## Expect

- Step 2: cycle A is selected with its last working week, Week 3, showing 2 of 2 workouts done.
  The dropdown offers Weeks 1–3 only — the deload week is not offered.
- Step 3: the name defaults to cycle A's name with " 2" appended; days and exercises are those of
  cycle A's Week 3, including any set added in R-20.
- Step 4: the start confirmation names the new cycle and says Week 1 Day 1 is next.
- Step 5: unlike a template cycle's first week, the strength sets show reps targets and prefilled
  weights computed from cycle A's history, with RIR 2 — e.g. Lateral Raise with the Week 3
  weight. (The exact start targets are under question in GT-257.)
- Bodyweight exercises (Pull Up, Dips) show no weight: body weight belongs to a cycle and is not
  copied — a known gap, asked again on the first log.
