# R-11 · Exercise ⋯ menu

Priority: P1 · Spec: 08.7, 05 · Where: Simulator

Precondition: cycle A active, a strength day of week 1 or 2 open with at least four exercises not
started yet. Below, "exercise 1 – 4" are four such exercises in their order on the day; the last
exercise of the day is used in step 5.

## Steps

1. Open the ⋯ of exercise 1.
2. Tap "Replace exercise" and pick another exercise of the same muscle group.
3. On exercise 2 log set 1. Open its ⋯ → "Replace exercise"; in the confirmation that comes
   first, cancel.
4. On exercise 3: ⋯ → "Add set", then ⋯ → "Remove last set", then "Remove last set" again
   until only one set is left; open the menu once more.
5. On the last exercise of the day open the ⋯; on the first exercise of the day open the ⋯.
6. On exercise 2 (one set logged): ⋯ → "Skip exercise", confirm. Then ⋯ → "Unskip
   exercise".
7. On exercise 4 log set 1, then ⋯ → "Delete exercise", confirm.
8. Try to replace an exercise with one that is already in the day.
9. Finish the day and open the same day of the next week.

## Expect

- Step 1: the menu offers replace, add / remove set, move up / down, skip and delete; items that
  can't be used now are greyed out, not hidden.
- Step 2: before the exercise is started the replacement happens without a warning; the new
  exercise takes the old one's place and sets.
- Step 3: replacing a started exercise asks first and warns that its logged sets will be deleted;
  Cancel leaves everything as it was.
- Step 4: the set count goes up and down by one; with one set left "Remove last set" is greyed
  out.
- Step 5: "Move down" is greyed out on the last exercise and "Move up" on the first.
- Step 6: skipping keeps the logged set and marks the exercise skipped; unskip brings it back.
- Step 7: deleting a started exercise warns first; the exercise disappears from the day.
- Step 8: the exercise already in the day is marked as already added and can't be picked.
- Step 9: next week has the replacement from step 2, the set count from step 4, and no exercise
  from step 7.
