import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Alert, Vibration } from 'react-native';

import type { IntervalTimer } from '@domain/intervalTimer';
import { cancelCountdown, scheduleCountdown } from '@state/intervalSignal';
import { useIntervalTimerStore } from '@state/intervalTimerStore';
import { useTimerCapsuleStore } from '@state/timerCapsuleStore';
import { useTimerRoundLogging } from '@state/useTimerRoundLogging';
import type { LogRoundResult } from '@usecases/roundLogging';

import { intervalCapsule } from './IntervalCapsuleLogic';
import {
  msToNextSecond,
  phaseChanged,
  roundsToLog,
  runningPhaseKey,
} from './IntervalTimerDriverLogic';
import { formatInProgressConflict } from './TodayScreenLogic';

// Runs the interval timer (10.1 FR-6, GT-96) wherever the app is: moves it on to the phase really
// running each time its second changes, aims the countdown at the end of each phase (state/intervalSignal,
// GT-94: ticks in the last 3 s and the start signal at zero), and buzzes as each phase starts and
// as the block ends. It writes each round to the log as the timer goes through it (GT-98): as its
// work ends, again as its rest does, and the one cut short by End early. While its screen is
// closed it puts the timer in the floating capsule (GT-97), a tap on which opens the screen again.
// Draws nothing itself. It sits next to RestTimerDriver in the tab bar's overlay, so the timer runs
// on behind its screen too.
//
// Keeping the app awake behind a locked screen and the Live Activity: IntervalLockScreenDriver.
export function IntervalTimerDriver() {
  const onOutcome = useCallback((outcome: LogRoundResult | { kind: 'failed'; error: unknown }) => {
    if (outcome.kind === 'conflict') {
      Alert.alert(
        formatInProgressConflict(outcome),
        "The timer's rounds can't be saved while another workout is in progress.",
      );
    } else if (outcome.kind === 'failed') {
      Alert.alert("Couldn't save the round", 'Log it by hand on the card.');
    }
  }, []);
  const logRound = useTimerRoundLogging(onOutcome);
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  // The subscription below is set up once; it reaches the logger through this, so a new one never
  // means re-subscribing — which would forget the rounds already written and write them again.
  const logRoundRef = useRef(logRound);
  useEffect(() => {
    logRoundRef.current = logRound;
  }, [logRound]);

  useEffect(() => {
    let tick: ReturnType<typeof setTimeout> | null = null;

    /**
     * Moves a running timer on as its time on screen changes — each second, and its phase's end
     * (`msToNextSecond`) — and redraws the capsule with it. Stops once nothing runs.
     */
    function scheduleTick() {
      if (tick !== null) clearTimeout(tick);
      tick = null;
      const timer = useIntervalTimerStore.getState().active?.timer;
      if (timer === undefined || runningPhaseKey(timer) === undefined) return;
      tick = setTimeout(
        () => {
          tick = null;
          useIntervalTimerStore.getState().catchUp();
          publishCapsule();
          scheduleTick();
        },
        msToNextSecond(timer, Date.now()),
      );
    }
    let lastTimer: IntervalTimer | undefined;
    let lastKey: string | undefined;

    /** The capsule while the timer's screen is closed; none of ours otherwise. */
    function publishCapsule() {
      const store = useIntervalTimerStore.getState();
      const slot = useTimerCapsuleStore.getState();
      if (store.active === null || !store.minimized) {
        slot.release('interval');
        return;
      }
      slot.show(
        intervalCapsule(store.active, Date.now(), {
          pause: store.pause,
          resume: store.resume,
          skipRest: store.skipRest,
          dismiss: store.close,
          open: () => routerRef.current.push('/interval-timer'),
        }),
        'interval',
      );
    }

    function update() {
      const active = useIntervalTimerStore.getState().active;
      const timer = active?.timer;
      if (active !== null) {
        for (const result of roundsToLog(lastTimer, timer)) {
          logRoundRef.current(
            {
              sessionId: active.exercise.sessionId,
              sessionExerciseId: active.exercise.sessionExerciseId,
            },
            result,
          );
        }
      }
      if (phaseChanged(lastTimer, timer)) {
        Vibration.vibrate();
      }
      const key = runningPhaseKey(timer);
      const keyChanged = key !== lastKey;
      if (keyChanged) {
        if (key === undefined || timer?.endsAt === undefined) {
          cancelCountdown();
        } else {
          scheduleCountdown(timer.endsAt);
        }
      }
      lastTimer = timer;
      lastKey = key;
      publishCapsule();

      // A new phase, a resume or a pause: the seconds now fall elsewhere, or not at all.
      if (keyChanged || (key !== undefined && tick === null)) {
        scheduleTick();
      }
    }

    update();
    const unsubscribe = useIntervalTimerStore.subscribe(update);
    return () => {
      unsubscribe();
      if (tick !== null) clearTimeout(tick);
      cancelCountdown();
    };
  }, []);

  return null;
}
