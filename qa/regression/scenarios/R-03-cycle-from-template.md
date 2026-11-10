# R-03 · Flow B: cycle from a template

Priority: P0 · Spec: 08.10, 04 · Where: Simulator

Precondition: no active and no planned cycle (chain step 2: right after R-01).

## Steps

1. Open the Cycles tab and tap the "+" in the header.
2. In the new-cycle sheet check that "From template" is selected, then tap "Next".
3. In the template list type "boxing" into the search.
4. Tap "Upper / Lower + Boxing Hybrid".
5. In the preview sheet tap "Use this template".
6. On the first step of the editor (name, length, days):
   - leave the name as it is;
   - check the length is 4 weeks;
   - tap "−" next to days per week until it is 2.
7. Tap "Continue" until the last step, then tap "Save cycle".

## Expect

- Step 3: the list shows only the matching template; the × in the search field clears it.
- Step 5: the preview shows the template's 4 days as tabs, each with its exercises, before
  anything is created.
- Step 6: the step opens prefilled with the template's name and 4 days; after setting 2 days only
  Day 1 and Day 2 remain on the next step.
- Day 2 contains power exercises (medball throws), "Heavy Bag" marked as an interval exercise and
  "Cooldown" marked as mobility.
- Step 7: the review step shows 4 weeks and 2 days per week.
- After saving: the Cycles tab shows the cycle as planned, with a "Start" pill, and a one-time
  coachmark points at it (first planned cycle only; close it).
- The Workout tab shows the empty state for a cycle that is planned but not started, with a
  button to the Cycles tab. No workout exists yet.
