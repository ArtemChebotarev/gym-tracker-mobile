# R-34 · Completed: delete a cycle with its history

Priority: P1 · Spec: 08.3, 08.9, 08.6 · Where: Simulator

Precondition: no active cycle, and a throwaway cycle D in Completed that can be lost: plan a
1-week cycle with one exercise that also has history in cycle A (e.g. bench press), start it, log
one set of that exercise at a weight A never used (e.g. 500), finish the workout, then stop D.
Cycle A is still in Completed or archived.

## Steps

1. On the Library tab open the exercise D logged and look at its history.
2. On the Cycles tab tap D's row; open the header ⋯ → "Delete", then cancel.
3. Go back; open D's row ⋯.
4. Tap "Delete", and confirm.
5. On the Library tab open the same exercise's history again.

## Expect

- Step 1: the history lists D's set (500) and A's sets.
- Step 2: the header ⋯ has Rename, Copy, Archive and Delete; Delete is red. The confirmation says
  the cycle's workouts and exercise history are deleted too, and that it can't be undone.
  Cancel keeps D.
- Step 3: the row's ⋯ has copy, archive and delete; delete is red.
- Step 4: the same confirmation; after it D disappears from the list.
- Step 5: D's set (500) is gone from the history; A's sets are still there.
