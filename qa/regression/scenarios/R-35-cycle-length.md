# R-35 · Change the length of a running cycle

Priority: P1 · Spec: 08.7, 03 · Where: Simulator

Precondition: no active cycle. A throwaway cycle E: 5 weeks, 1 day a week, one strength exercise
with 3 sets (e.g. bench press). Start it, log every set of weeks 1–3 at the same weight and finish
all three workouts, so week 4 is the next one and nothing in it is logged.

## Steps

1. On the Today tab tap ⊞ in the workout header.
2. Tap "−" under the grid.
3. Close the sheet and look at week 4's workout.
4. Open ⊞ again and tap "+" twice.
5. Close the sheet and look at week 4's workout again.
6. Log set 1 of week 4, then open ⊞.
7. Stop cycle E (header ⋯ → "Stop cycle").

## Expect

- Step 1: under the grid "Cycle length" reads "5 weeks", with "Shortest now: 4 weeks" under it.
- Step 2: "4 weeks"; the grid has 4 weeks and week 4 is labelled Deload; the subtitle reads
  "Week 4 of 4"; "−" is greyed out.
- Step 3: the header shows the Deload badge; the exercise has 2 sets at half of week 3's weight.
- Step 4: "6 weeks"; the grid has 6 weeks and only week 6 is labelled Deload.
- Step 5: no Deload badge; 3 sets at week 3's weight; the RIR badge reads "1 RIR" — the same as
  week 3, not higher.
- Step 6: "Shortest now: 5 weeks", and "−" is greyed out at 5.
- Step 7: E leaves the Today tab like any stopped cycle.
