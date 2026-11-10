# R-21 · Deload week

Priority: P0 · Spec: 03, 08.11 · Where: Simulator

Precondition: cycle A active, Weeks 1–3 done, Week 4 Day 1 not started. To get there, log and
finish every workout of Weeks 2 and 3 with any values.

## Steps

1. From the ⊞ grid open Week 3 Day 1 and note the reps logged in each set of "Lateral Raise".
2. Open Week 4 Day 1.
3. Close the dialog with "Got it".
4. Look at the first strength exercise, "Lateral Raise".
5. Open the header ⋯, then an exercise's ⋯.
6. Log and finish the workout.

## Expect

- Step 2: a dialog "Deload week" — "The last week of your cycle. Time to recover before the next
  one." — with three rows: "50% load", "Less volume", "Go easy", and "Reps shown are a guide based
  on last week." Shown once per user.
- Step 4: a "Deload" badge instead of an RIR number, on every card and in the header; fewer sets
  than in Week 3; half the Week 3 weight prefilled; the reps placeholder of each set equals the
  reps noted in step 1 for that set; no ⓘ by "Weight, kg"; after logging only a ✓, no hit
  indicator.
- Step 5: the header ⋯ has "Skip workout", "Rename cycle", "Cycle history", "Stop cycle" — no
  "Add exercise". The exercise ⋯ still has "Replace exercise". Close menus with care: "Stop cycle"
  is in the header menu.
- Step 6: the summary does not promise progression for a next week.
