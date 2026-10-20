// The interval timer's screen (10.1 FR-6, GT-96) — opened by Start timer on an interval card, full
// screen over the workout. The timer itself lives in state/intervalTimerStore and runs on in
// components/IntervalTimerDriver; this route only shows it and passes the taps on. It reads the
// clock a few times a second while a phase runs, so the time on the dial moves.
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { IntervalTimerScreen } from '@components/IntervalTimerScreen';
import {
  endEarlyMessage,
  intervalSummaryView,
  intervalTimerView,
} from '@components/IntervalTimerScreenLogic';
import { isIntervalTimerRunning } from '@domain/intervalTimerRules';
import { useIntervalTimerStore } from '@state/intervalTimerStore';

/** How often the dial is redrawn while a phase runs. */
const REDRAW_MS = 250;

export default function IntervalTimerRoute() {
  const router = useRouter();
  const active = useIntervalTimerStore((s) => s.active);
  const { pause, resume, skipRest, endEarly, close } = useIntervalTimerStore.getState();
  const [now, setNow] = useState(() => Date.now());
  const running = active !== null && isIntervalTimerRunning(active.timer);

  useEffect(() => {
    if (!running) return undefined;
    // At once too, not only on the next tick: after a resume the last reading is the moment of
    // the pause, and the dial would show that for a beat.
    const first = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), REDRAW_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [running, active]);

  // Nothing to show — the timer was put away, or the route was opened without one.
  useEffect(() => {
    if (active === null && router.canGoBack()) router.back();
  }, [active, router]);

  if (active === null) {
    return null;
  }

  const view = intervalTimerView(active, now);
  const summary = intervalSummaryView(active);

  return (
    <IntervalTimerScreen
      {...(view !== undefined ? { view } : {})}
      {...(summary !== undefined ? { summary } : {})}
      onPause={pause}
      onResume={resume}
      onSkipRest={skipRest}
      endEarlyMessage={() => endEarlyMessage(active, Date.now())}
      onEndEarly={() => {
        // The rounds it leaves are logged by GT-98; the workout is where the user goes next.
        endEarly();
        close();
      }}
      onBackToWorkout={close}
    />
  );
}
