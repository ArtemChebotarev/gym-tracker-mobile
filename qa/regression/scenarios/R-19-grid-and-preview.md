# R-19 · Week grid and a future day

Priority: P1 · Spec: 08.7 · Where: Simulator

Precondition: cycle A active, a working week in progress: one day done, the other not finished.

## Steps

1. Tap ⊞ in the workout header and wait for the sheet to settle.
2. Tap the next week's copy of the unfinished day (it waits for this week's day). Then tap a day
   two weeks ahead.
3. Look at the cards and open the header ⋯.
4. Open the ⊞ grid again and tap today's day.

## Expect

- Step 1: every week and day of the cycle, each marked done, skipped or left to do; a ring marks
  the day open now.
- Step 2: the next week's day opens in preview: every card says it is not programmed yet and
  which workout unlocks it. A day further ahead says it is not programmed yet.
- Step 3: no Log squares; the header ⋯ offers only rename, cycle history and stop cycle.
- Step 4: back to the live day, unchanged.
