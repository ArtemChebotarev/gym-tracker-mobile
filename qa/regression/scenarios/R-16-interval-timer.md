# R-16 · Interval timer

Priority: P1 · Spec: 05, 08 · Where: Simulator

Precondition: cycle A active, Day 2 of a week open, the previous week's Day 2 done
(not skipped — otherwise nothing is prefilled) and not finished; "Heavy Bag" not logged. Set
"Get ready" in Settings to 5 s (the default).

## Steps

1. On "Heavy Bag" tap "Start timer".
2. Let get ready and round 1's work run; during round 1's rest tap pause, then resume.
3. During round 2's rest tap skip rest.
4. During round 3's work minimize the timer (chevron or swipe down).
5. Try to change a round's time on the card.
6. Tap the Log square of the next round that is not logged yet.
7. Choose to stop the timer and log.
8. On another day (or after unlogging the rounds) start the timer again and end it early during
   round 2, confirming.
9. Start it once more and let all rounds run to the end; leave through the summary's button.

## Expect

- Step 1: a full-screen timer opens with the round count, on get ready (5 s). Note: in the rest
  view the big middle button is skip rest, where pause sits during work.
- Step 2: phases go get ready → work → rest; pause stops the clock and says it continues from here;
  resume continues from the same time. Each round logs itself when its work ends.
- Step 3: the rest ends at once and is recorded as skipped on the card.
- Step 4: the timer shrinks to the capsule above the tab bar and keeps running.
- Step 5: round fields are locked while the timer runs.
- Step 6: a confirmation asks whether to stop the timer, with cancel and stop-and-log.
- Step 7: the timer stops; the round is logged.
- Step 8: ending early asks first; the partial work is logged; the timer closes without a summary
  and no rest starts.
- Step 9: a summary says all rounds are done; it closes only through its button, back to the
  workout, and a rest starts. (If the timer ends while minimized there is no summary; the capsule
  shows it done.)

## Manual only

- The countdown ticks, phase vibration, and running with the screen locked or in silent mode
  (D-05).
