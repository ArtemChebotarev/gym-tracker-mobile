# R-30 · Timer settings take effect

Priority: P1 · Spec: 08 · Where: Simulator

Precondition: a workout with unlogged strength sets and an unlogged interval exercise.

## Steps

1. Settings → rest between sets: tap "−" until the minimum, then "+" once.
2. Log a strength set.
3. Settings → turn the rest timer off. Log another set.
4. Turn it back on and set it to 2:00.
5. Settings → get ready: set 10 s. Start an interval timer.
6. Set get ready to 0 s and start an interval timer again.

## Expect

- Step 1: the minimum is 1:00 and "+" moves by 15 s (1:15).
- Step 2: the rest starts at 1:15.
- Step 3: no rest starts.
- Step 5: the timer starts with a 10 s get ready.
- Step 6: no get ready; work starts at once.
- Settings are kept after closing and reopening the app.
