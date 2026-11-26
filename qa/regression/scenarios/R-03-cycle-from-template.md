# R-03 · Flow B: cycle from a template

Priority: P0 · Spec: 08.10, 08.5, 08.11, 04 · Where: Simulator

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
7. Tap "Continue". On the days step a coachmark points at the ⇅ in front of "Day 1" — tap "Got it".
8. Tap the ⇅. In the "Reorder days" sheet drag Day 2 by its ≡ above Day 1, then tap "Done".
9. Tap "Continue" to the last step, then tap "Save cycle".

## Expect

- Step 3: the list shows only the matching template; the × in the search field clears it.
- Step 5: the preview shows the template's 4 days as tabs, each with its exercises, before
  anything is created.
- Step 6: the step opens prefilled with the template's name and 4 days; after setting 2 days only
  Day 1 and Day 2 remain on the next step.
- Before step 8, Day 2 contains power exercises (medball throws), "Heavy Bag" marked as an
  interval exercise and "Cooldown" marked as mobility.
- Step 7: the coachmark comes up a moment after the step opens, and does not come back when you
  step back to the first step and forward again.
- Step 8: the sheet lists Day 1 and Day 2, each with its exercises' names under it; while dragging
  the other day slides out of the way, and each day keeps its own number in the sheet (the list
  reads Day 2, Day 1). The day open in the tabs is lit in the sheet and stays lit as it moves.
  After "Done" the tabs are renumbered: Day 1 holds the medball throws, Heavy Bag and Cooldown,
  Day 2 the former Day 1, and the tab of the day that was open is the one open. "Days reordered"
  with "Undo" comes up over "Continue" and goes away by itself after about 5 seconds; tapping
  "Undo" before that puts both days back. Opening the sheet again and closing it by dragging it
  down, or tapping "Done" without moving anything, changes nothing and shows no "Days reordered".
- Step 9: the review step shows 4 weeks and 2 days per week, with the days in the new order.
- After saving: the Cycles tab shows the cycle as planned, with a "Start" pill, and a one-time
  coachmark points at it (first planned cycle only; close it).
- The Workout tab shows the empty state for a cycle that is planned but not started, with a
  button to the Cycles tab. No workout exists yet.
