# R-26 · Exercise history across cycles

Priority: P1 · Spec: 08.6, 06 · Where: Simulator

Precondition: an exercise logged in two different finished workouts of two different cycles (e.g.
"Lateral Raise" in cycle A and its copy); in a later finished workout it was skipped after one set,
and in another skipped with nothing logged; and one workout with it is still in progress, with a
set logged.

## Steps

1. In a workout tap the exercise's name.
2. Open the history tab of the exercise screen.
3. Go back; in a workout tap the history icon of the exercise.

## Expect

- Step 1: the exercise's overview opens. Its Sessions tile counts the finished workouts with
  something logged — the in-progress one and the skip with nothing logged are not counted.
- Step 2: sessions from both cycles, newest first, each with its sets. The workout skipped after
  one set is listed with that one set; the skip with nothing logged and the workout in progress
  are not listed. The number of sessions listed equals the Sessions tile.
- Step 3: the same screen opens straight on its history tab.
