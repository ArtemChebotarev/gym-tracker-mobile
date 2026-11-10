# R-05 · Flow C: copy a finished cycle

Priority: P0 · Spec: 08.8, 04 · Where: Simulator

Precondition: cycle A completed (after R-22), nothing active or planned except "Scratch test" if
R-06 kept it.

## Steps

1. On the Cycles tab tap the "+" in the header, tap "Copy a cycle", then "Next".
2. On "Select a week to copy", look at what is selected; then tap the Week dropdown.
3. Keep the defaults and tap "Continue" through "New training cycle" (name, length, days) and
   "Days & exercises" to "Review", and tap "Save cycle".
4. Start the new cycle (R-07 part 1 steps 1–2).
5. Look at Week 1 Day 1.

## Expect

- Step 2: cycle A is selected with its last working week, "Week 3 · 2 of 2 workouts", and the
  hint "Defaults to your last working week — deload weeks aren't included." The dropdown offers
  Weeks 1–3 only.
- Step 3: the name defaults to "Upper / Lower + Boxing Hybrid 2"; days and exercises are those of
  cycle A's Week 3 (including any set added in R-20).
- Step 4: the start dialog names the cycle, "4 weeks · 2 days/week. Week 1 Day 1 is next."
- Step 5: unlike a template cycle's first week, the strength sets show reps targets and prefilled
  weights computed from cycle A's history, with "2 RIR" — e.g. Lateral Raise with the Week 3
  weight.
- Bodyweight exercises (Pull Up, Dips) show "–" for weight: body weight belongs to a cycle and is
  not copied — a known gap, asked again on the first log.
