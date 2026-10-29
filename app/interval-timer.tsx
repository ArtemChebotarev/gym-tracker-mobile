// The interval timer's screen (10.1 FR-6, GT-96) — opened by Start timer on an interval card, full
// screen over the workout. The timer itself lives in state/intervalTimerStore and runs on in
// components/IntervalTimerDriver; this route only shows it and passes the taps on. Its being open
// is what "not minimised" means (GT-97): it says so as it opens, and as it goes — by the chevron,
// a swipe down, or the back button — the timer folds into the capsule and runs on. It reads the
// clock a few times a second while a phase runs, so the time on the dial moves.
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { msToNextSecond } from '@components/IntervalTimerDriverLogic';
import { IntervalTimerScreen } from '@components/IntervalTimerScreen';
import {
  endEarlyMessage,
  intervalSummaryView,
  intervalTimerView,
} from '@components/IntervalTimerScreenLogic';
import { isIntervalTimerRunning } from '@domain/intervalTimerRules';
import { useIntervalTimerStore } from '@state/intervalTimerStore';

export default function IntervalTimerRoute() {
  const router = useRouter();
  const active = useIntervalTimerStore((s) => s.active);
  const { pause, resume, skipRest, endEarly, close } = useIntervalTimerStore.getState();
  const [now, setNow] = useState(() => Date.now());
  const running = active !== null && isIntervalTimerRunning(active.timer);

  useEffect(() => {
    if (!running || active === null) return undefined;
    const timer = active.timer;
    // Redrawn as each second changes (msToNextSecond), not on a fixed beat — and at once, too: after
    // a resume the last reading is the moment of the pause, and the dial would show that for a beat.
    let next: ReturnType<typeof setTimeout>;
    const redraw = () => {
      setNow(Date.now());
      next = setTimeout(redraw, msToNextSecond(timer, Date.now()));
    };
    next = setTimeout(redraw, 0);
    return () => clearTimeout(next);
  }, [running, active]);

  useEffect(() => {
    useIntervalTimerStore.getState().expand();
    return () => useIntervalTimerStore.getState().minimize();
  }, []);

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
      onMinimize={() => router.back()}
    />
  );
}
