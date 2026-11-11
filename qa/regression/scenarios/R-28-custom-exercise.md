# R-28 · Custom exercise: create, edit, hide

Priority: P1 · Spec: 08.6 · Where: Simulator

Precondition: any; for step 6, a cycle being created or a day open.

## Steps

1. Library → create a new exercise; choose the strength type.
2. Try to save without a muscle group; then pick one and save.
3. Open it, edit its name, save. Try to change its type.
4. Create a power exercise and look at its load options; create an interval exercise and look at
   its progression step.
5. Open the strength exercise's ⋯ → "Hide".
6. Open an exercise picker (in a day of the cycle editor, or Add exercise in a workout) and search
   for both exercises.

## Expect

- Step 1: the type is chosen first, then the fields.
- Step 2: saving is blocked until a muscle group is picked; after saving the exercise is in the
  library under that group.
- Step 3: the new name is kept; the type can't be changed (locked from creation).
- Step 4: power offers kg, level or none as load; interval has a progression step.
- Step 5: a confirmation first; then the exercise disappears from the library list.
- Step 6: the hidden exercise is not offered; the other custom ones are.
