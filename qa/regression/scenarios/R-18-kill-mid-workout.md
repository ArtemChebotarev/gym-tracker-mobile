# R-18 · Kill the app mid-workout

Priority: P0 · Spec: 05 · Where: Simulator

Precondition: cycle A active, a strength workout open and not started.

## Steps

1. Log sets 1 and 2 of the first exercise.
2. On set 3 type a weight and reps but do not log it.
3. Close the app completely (app switcher, swipe it away) and open it again. It opens on the
   Workout tab.

## Expect

- The same workout opens, still in progress (today's date and the progress bar in the header).
- Sets 1 and 2 are logged with the values entered.
- Set 3 is not logged; the values typed into it are gone — unlogged input is not kept, by design.
- Set 3 shows its target values again, not what was typed.
- No rest bar: a timer does not survive the app being closed.
- The rest of the workout can be logged and finished as usual.
