import { useEffect } from 'react';

import { restIsOver } from '@domain/restTimerRules';
import { signalRestOver } from '@state/restSignal';
import { useRestTimerStore } from '@state/restTimerStore';
import { useTimerCapsuleStore } from '@state/timerCapsuleStore';

import { restCapsule } from './RestTimerDriverLogic';

/** How often a running rest is looked at: often enough that the second changes on time. */
const TICK_MS = 250;

// Runs the rest between sets (10.1 FR-5, GT-86): while a rest counts down it looks at the clock a
// few times a second, puts what is left into the floating capsule (state/timerCapsuleStore), and
// when the time is up gives the signal and turns the capsule into `Rest is over`. Draws nothing
// itself. It sits next to the capsule's host in the tab bar's overlay, so a rest keeps running
// and keeps showing whichever tab is open.
//
// It works off the stores rather than React state: every change of the rest and every tick reads
// the rest and the clock afresh and publishes the capsule. What is left is always worked out from
// the clock, never counted down tick by tick, so a rest that went on while the app was in the
// background shows the right time when it comes back.
export function RestTimerDriver() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    function update() {
      const rest = useRestTimerStore.getState();
      const now = Date.now();
      if (rest.timer !== null && restIsOver(rest.timer, now)) {
        // `finish` changes the store, which calls `update` again with the rest run out.
        rest.finish();
        signalRestOver();
        return;
      }
      const capsule = restCapsule(rest, now, rest);
      const slot = useTimerCapsuleStore.getState();
      if (capsule === null) {
        slot.clear();
      } else {
        slot.show(capsule);
      }
      const running = rest.timer?.endsAt !== undefined;
      if (running && interval === null) {
        interval = setInterval(update, TICK_MS);
      } else if (!running && interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    }

    update();
    const unsubscribe = useRestTimerStore.subscribe(update);
    return () => {
      unsubscribe();
      if (interval !== null) clearInterval(interval);
    };
  }, []);

  return null;
}
