# R-16 · Interval timer

Priority: P1 · Spec: 05, 08 · Where: Simulator

Precondition: cycle A active, Day 2 of a working week (not deload — deload has two short rounds)
open (values are prefilled from each
exercise's last logged session) and not finished; "Heavy Bag" not logged. Set
"Get ready" in Settings to 5 s (the default).

## Steps

1. On "Heavy Bag" set work and rest of round 1 to 0:30 (the rounds below follow) — long enough to
   act inside a phase. The time is a wheel with 5 s steps that overshoots easily; check the value.
   Tap "Start timer".
2. Let get ready and round 1's work run; during round 1's rest tap pause, then resume.
3. During round 2's rest tap skip rest.
4. During round 3's work minimize the timer (chevron or swipe down).
5. Try to change a round's time on the card.
6. Tap the Log square of the next round that is not logged yet.
7. Choose to stop the timer and log.
8. On another day (or after unlogging the rounds) start the timer again and end it early during
   round 2, confirming.
9. Start it once more and let all rounds run to the end; leave through the summary's button.
10. In a later week, log one set on Day 1 and leave it in progress. Open that week's Day 2 from
    the ⊞ week grid and tap "Start timer" on "Heavy Bag".

## Expect

- Step 1: a full-screen timer opens with the round count, on get ready (5 s). Note: in the rest
  view the big middle button is skip rest, where pause sits during work.
- Step 2: phases go get ready → work → rest; pause stops the clock and says it continues from here;
  resume continues from the same time. Each round logs itself when its work ends.
- Step 3: the rest ends at once and is recorded as skipped on the card; the next round starts
  with get ready — unless the skip came in the rest's last seconds, which already were its get
  ready: then work starts at once.
- Step 4: the timer shrinks to the capsule above the tab bar and keeps running.
- Step 5: round fields are locked while the timer runs.
- Step 6: a confirmation asks whether to stop the timer, with cancel and stop-and-log; the timer
  keeps running while it is open.
- Step 7: the timer stops; the round is logged with the time at the moment of confirming.
- Step 8: ending early asks first; the timer keeps running while the question is open, and the
  work done by the moment of confirming is logged; the timer closes without a summary and no rest
  starts.
- Step 9: a summary says all rounds are done; it closes only through its button, back to the
  workout, and a rest before the next exercise starts — as long as the last round's rest field,
  not the Settings rest (an interval has no rest from Settings). (If the timer ends while minimized there is no summary; a short
  message says the rounds are logged.)

- Step 10: no timer starts. An alert says to finish the day in progress first, naming its week
  and day, with Cancel and Open; Open goes to that day.

## Manual only

- The countdown ticks, phase vibration, and running with the screen locked or in silent mode
  (D-05).
