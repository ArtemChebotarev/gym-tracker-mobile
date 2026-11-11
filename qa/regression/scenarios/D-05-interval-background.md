# D-05 · Interval timer in the background

Priority: P1 · Spec: 05 · Where: Phone (TestFlight)

Precondition: a workout with an interval exercise; music playing from another app.

## Steps

1. Start the interval timer and lock the phone.
2. Switch the phone to silent mode during a round.
3. Unlock and come back to the app.

## Expect

- Step 1: the timer keeps running; the countdown ticks of the last seconds play, mixed with the
  music rather than stopping it; a vibration on each phase change.
- Step 2: the ticks still play in silent mode.
- Step 3: the timer shows the right phase and time; rounds that ended meanwhile are logged. No
  notifications are used for intervals.
