import { useCallback, useEffect, useRef } from 'react';
import { Alert, Vibration } from 'react-native';

import type { IntervalTimer } from '@domain/intervalTimer';
import { cancelCountdown, scheduleCountdown } from '@state/intervalSignal';
import { useIntervalTimerStore } from '@state/intervalTimerStore';
import { useTimerRoundLogging } from '@state/useTimerRoundLogging';
import type { LogRoundResult } from '@usecases/roundLogging';

import { phaseChanged, roundsToLog, runningPhaseKey } from './IntervalTimerDriverLogic';
import { formatInProgressConflict } from './TodayScreenLogic';

/** How often a running timer is moved on: often enough that a phase changes on time. */
const TICK_MS = 250;

// Runs the interval timer (10.1 FR-6, GT-96) wherever the app is: moves it on to the phase really
// running a few times a second, aims the countdown at the end of each phase (state/intervalSignal,
// GT-94: ticks in the last 3 s and the start signal at zero), and buzzes as each phase starts and
// as the block ends. It writes each round to the log as the timer goes through it (GT-98): as its
// work ends, again as its rest does, and the one cut short by End early. Draws nothing. It sits next to RestTimerDriver in the tab bar's overlay, so the
// timer runs on behind its screen too.
//
// Keeping the app awake behind a locked screen and the Live Activity are GT-99's.
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
  // The subscription below is set up once; it reaches the logger through this, so a new one never
  // means re-subscribing — which would forget the rounds already written and write them again.
  const logRoundRef = useRef(logRound);
  useEffect(() => {
    logRoundRef.current = logRound;
  }, [logRound]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let lastTimer: IntervalTimer | undefined;
    let lastKey: string | undefined;

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
      if (key !== lastKey) {
        if (key === undefined || timer?.endsAt === undefined) {
          cancelCountdown();
        } else {
          scheduleCountdown(timer.endsAt);
        }
      }
      lastTimer = timer;
      lastKey = key;

      if (key !== undefined && interval === null) {
        interval = setInterval(() => useIntervalTimerStore.getState().catchUp(), TICK_MS);
      } else if (key === undefined && interval !== null) {
        clearInterval(interval);
        interval = null;
      }
    }

    update();
    const unsubscribe = useIntervalTimerStore.subscribe(update);
    return () => {
      unsubscribe();
      if (interval !== null) clearInterval(interval);
      cancelCountdown();
    };
  }, []);

  return null;
}
