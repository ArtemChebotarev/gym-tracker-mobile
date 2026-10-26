import { useEffect } from 'react';

import { keepAwakeForTimer, releaseTimer } from '@state/intervalSignal';
import { useIntervalTimerStore } from '@state/intervalTimerStore';

// The interval timer behind a locked screen (10.1 FR-6, GT-99), the way the GT-94 spike found and
// the phone confirmed: from a block's start until it is over or put away, a silent loop keeps the
// app awake (state/intervalSignal). iOS would otherwise suspend it soon after the screen locks, and
// a suspended app neither moves the timer on, nor beeps, nor logs its rounds. It is kept while
// paused too, so the block goes on where it stopped.
//
// The Live Activity is parked (IntervalLiveActivityDriver, GT-180): the timer shows in the app
// only, its signals are heard behind a locked screen.
//
// Draws nothing. It sits next to IntervalTimerDriver in the tab bar's overlay.

export function IntervalLockScreenDriver() {
  useEffect(() => {
    let block: object | null = null;

    function update() {
      const active = useIntervalTimerStore.getState().active;
      const running = active !== null && active.timer.phase !== undefined;
      // A block started — a new one, or this one once more after End early.
      if (running && active.exercise !== block) {
        block = active.exercise;
        void keepAwakeForTimer();
      } else if (!running && block !== null) {
        // Over: done, ended early, or put away.
        block = null;
        releaseTimer();
      }
    }

    update();
    return useIntervalTimerStore.subscribe(update);
  }, []);

  return null;
}
