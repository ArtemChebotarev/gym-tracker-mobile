# R-06 · Planned cycle: discard a draft, edit, delete

Priority: P1 · Spec: 08.5, 08.3 · Where: Simulator

Precondition: a planned cycle "Scratch test" exists (after R-04).

## Steps

1. Cycles → "+" → "From scratch" → "Next". Type a name, then close the editor with ✕.
2. Choose to keep editing; close with ✕ again and choose to discard.
3. Cycles → "+" → "From scratch" → "Next", and close with ✕ without typing anything.
4. Tap the "Scratch test" row. Change its name to "Scratch test edited", go to the review step and
   save.
5. Tap the row again and close the editor with ✕ without changes.
6. Open the row's ⋯ → "Delete", then cancel.
7. Open the row's ⋯ → "Delete" again, and confirm.

## Expect

- Step 1: a discard confirmation with keep-editing and discard choices.
- Step 2: keep editing returns to the draft as it was; discard closes the editor and creates
  nothing.
- Step 3: an empty draft closes without asking.
- Step 4: the same editor opens on the saved cycle's values; after saving, the row shows the new
  name and the cycle is still planned.
- Step 5: editing a planned cycle never asks to discard.
- Step 6: the confirmation says it can't be undone; Cancel keeps the cycle.
- Step 7: the cycle is gone from the list.
