# R-20 · Week → next week: progression and carried structure

Priority: P0 · Spec: 03, 05 · Where: Simulator

Precondition: cycle A active, a Day 2 of a working week (Week 1 – 3) not started, the same day of
the previous week done (as after R-08 for Week 1 Day 2).

Day 2 holds every exercise type. On it a strength or power set is logged by its Log square,
"Heavy Bag" (interval) has a row per round — "Work ⓘ / Rest / Log" — plus "Start timer · 3
rounds", and "Cooldown" (mobility) has one "Duration / Log" row plus "Start timer".

## Steps

1. Before logging anything, open the ⋯ of the first strength exercise and tap "Add set".
2. On "Heavy Bag" tap the Rest time of round 1 and set it to 0:20; confirm that the rounds below
   follow.
3. Log every strength and power set with any weight and reps; note the reps of the first
   exercise's sets.
4. On "Heavy Bag" tap the Log square of every round.
5. On "Cooldown" tap its Log square.
6. Finish the workout and tap "Next workout".
7. Open the same day of the next week from the ⊞ grid.

## Expect

- Step 1: the exercise has one more set; a coachmark explains that edits carry to next week
  (first structural edit only).
- Step 6: the summary reads "Day 2 done", "Progression added to next week's Day 2.", with a "+1
  rep" row per strength exercise, and "Up next: Week {next} Day 1".
- Step 7, the next week's Day 2:
  - every strength set shows a reps target equal to the reps logged in the same set + 1, with the
    same weight prefilled;
  - the RIR pill goes down by one (Week 1 "2 RIR" → Week 2 "1 RIR" → Week 3 "0 RIR");
  - the exercise from step 1 keeps the added set;
  - "Heavy Bag" rest is 0:15 — one 5-second step down from 0:20, because every round was done.
    (Its rest never goes below 0:10: logged at 0:10, it stays at 0:10.)
- "Need a different weight?" appears once per user, on the first card with weight ranges — only
  if it has not been seen before.
