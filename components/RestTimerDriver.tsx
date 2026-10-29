import { useEffect, useRef } from 'react';

import { restIsOver, restRemainingMs } from '@domain/restTimerRules';
import { DEFAULT_SIGNALS } from '@domain/signals';
import { msUntilSecondChanges } from '@domain/time';
import { signalRestOver } from '@state/restSignal';
import { useRestTimerStore } from '@state/restTimerStore';
import { useTimerCapsuleStore } from '@state/timerCapsuleStore';
import { useTimerSettings } from '@state/useTimerSettings';

import { restCapsule } from './RestTimerDriverLogic';

// Runs the rest between sets (10.1 FR-5, GT-86): while a rest counts down it looks at the clock
// each time its second changes (`msUntilSecondChanges`; a fixed beat made the time jerk), puts what is left into the floating capsule (state/timerCapsuleStore), and
// when the time is up gives the signal and turns the capsule into `Rest is over`. Draws nothing
// itself. It sits next to the capsule's host in the tab bar's overlay, so a rest keeps running
// and keeps showing whichever tab is open.
//
// It works off the stores rather than React state: every change of the rest and every tick reads
// the rest and the clock afresh and publishes the capsule. What is left is always worked out from
// the clock, never counted down tick by tick, so a rest that went on while the app was in the
// background shows the right time when it comes back.
//
// The signal follows the settings as they are when the rest runs out (GT-172), not as they were
// when it started; until they have been read it is given as it ships, sound and vibration both.
export function RestTimerDriver() {
  const signals = useTimerSettings().data?.signals ?? DEFAULT_SIGNALS;
  const signalsRef = useRef(signals);
  useEffect(() => {
    signalsRef.current = signals;
  }, [signals]);

  useEffect(() => {
    let tick: ReturnType<typeof setTimeout> | null = null;

    function update() {
      const rest = useRestTimerStore.getState();
      const now = Date.now();
      if (rest.timer !== null && restIsOver(rest.timer, now)) {
        // `finish` changes the store, which calls `update` again with the rest run out.
        rest.finish();
        signalRestOver(signalsRef.current);
        return;
      }
      const capsule = restCapsule(rest, now, rest);
      const slot = useTimerCapsuleStore.getState();
      if (capsule === null) {
        slot.release('rest');
      } else {
        slot.show(capsule, 'rest');
      }
      if (tick !== null) clearTimeout(tick);
      tick = null;
      if (rest.timer?.endsAt !== undefined) {
        tick = setTimeout(update, msUntilSecondChanges(restRemainingMs(rest.timer, now)));
      }
    }

    update();
    const unsubscribe = useRestTimerStore.subscribe(update);
    return () => {
      unsubscribe();
      if (tick !== null) clearTimeout(tick);
    };
  }, []);

  return null;
}
