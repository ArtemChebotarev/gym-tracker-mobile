# R-09 · Rest timer in the app

Priority: P0 · Spec: 05, 08 · Where: Simulator

Precondition: cycle A active, a strength workout open with at least two unlogged sets left on an
exercise; the rest timer is on in Settings (the default, 2:00).

## Steps

1. Log a set that is not the last set of its exercise.
2. Tap the pause icon on the rest bar; wait 10 seconds; tap it again to resume.
3. Tap "Skip".
4. Log the next set and leave the rest to run out (2 minutes).
5. Close the rest-over banner with ×.
6. Log the last set of the exercise.
7. Unlog the set from step 6 and log it again.

## Expect

- Step 1: a rest bar appears at the bottom, naming the next set and counting down from 2:00,
  with "Skip" and a pause control.
- Step 2: the countdown stops while paused and goes on from the same time after resuming.
- Step 3: the rest bar disappears.
- Step 4: at 0:00 the bar turns into a rest-over banner with an ×. Nothing starts by itself.
- Step 6: the rest bar names the next exercise instead of a set.
- Step 7: logging a set again after unlogging it does not start a new rest; a rest already
  running keeps counting.
- One timer at a time: logging another set while a rest runs restarts it at 2:00, never shows two
  bars.

## Manual only

- Sound and vibration at the end of rest (D-03); the notification with the app in the background
  (D-01); the screen staying on during rest (D-04).
