# R-24 · Completed: copy and archive

Priority: P1 · Spec: 08.3 · Where: Simulator

Precondition: at least one completed or stopped cycle; no active cycle.

## Steps

1. On the Cycles tab open a completed cycle's ⋯.
2. Tap "Copy".
3. Close the copy flow with ✕ (on its first step nothing is drafted yet, so it closes without
   asking).
4. Open the same ⋯ → "Archive", then cancel.
5. Open it again → "Archive", and confirm.

## Expect

- Step 1: the menu has copy, archive and delete; only delete is red (R-34 covers it).
- Step 2: the copy flow opens with this cycle already selected as the source.
- Step 4: the confirmation says the cycle will be archived and its exercise history stays; Cancel
  keeps the cycle.
- Step 5: the cycle disappears from the list.
