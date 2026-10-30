import { useKeepAwake } from 'expo-keep-awake';

import { useIntervalTimerStore } from '@state/intervalTimerStore';
import { useRestTimerStore } from '@state/restTimerStore';

// Keeps the screen on while a timer is running or paused (GT-204): the rest between sets, or a phase
// of the interval timer — Get ready, work, rest. A timer is watched from across the room, and the
// system's auto-lock would take the time off the screen. It goes with the timer: run out, skipped,
// ended early, and on the interval timer's summary, where no phase is left. The lock button works
// as ever, and the system's settings are not touched.
//
// Draws nothing. It sits next to the timers' drivers in the tab bar's overlay, so it holds whichever
// tab is open and with the timer full screen or in the capsule alike.

function KeepScreenAwake() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true });
  return null;
}

export function TimerKeepAwakeDriver() {
  const resting = useRestTimerStore((s) => s.timer !== null);
  const intervalRunning = useIntervalTimerStore((s) => s.active?.timer.phase !== undefined);

  return resting || intervalRunning ? <KeepScreenAwake /> : null;
}
