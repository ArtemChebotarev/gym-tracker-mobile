import { create } from 'zustand';

import type { IntervalTimer, IntervalTimerRound } from '@domain/intervalTimer';
import {
  endIntervalTimerEarly,
  intervalTimerAt,
  pauseIntervalTimer,
  resumeIntervalTimer,
  skipIntervalRest,
  startIntervalTimer,
} from '@domain/intervalTimerRules';

import { useRestTimerStore } from './restTimerStore';

// The interval timer that is running, paused or just finished (10.1 FR-6, GT-96), with the exercise
// it times. App state, not stored — like the rest timer: a block is minutes long, and its rounds
// are logged as they finish (GT-98), so nothing is lost with it.
//
// The clock is read here, at the moment of each action, and handed to the pure rules in
// `domain/intervalTimerRules.ts`. `catchUp` moves the timer on to the phase really running —
// components/IntervalTimerDriver calls it a few times a second; what the screen shows is worked out
// from the timer and the time by components/IntervalTimerScreenLogic.ts.
//
// Only one timer runs at a time (FR-6): starting this one drops any rest that was counting down.

/** The exercise a timer runs for, as its screen names it. */
export type IntervalTimerExercise = {
  /** The session the rounds are logged into (GT-98). */
  sessionId: string;
  sessionExerciseId: string;
  name: string;
  /** Every round of the exercise, logged ones included — `Round 2 of 3`, the segments. */
  totalRounds: number;
  /** The rounds logged before the timer started — they show as done. */
  loggedRoundNumbers: readonly number[];
};

export type ActiveIntervalTimer = { exercise: IntervalTimerExercise; timer: IntervalTimer };

type IntervalTimerStore = {
  active: ActiveIntervalTimer | null;
  /** Starts the timer over `rounds` — the exercise's rounds from the first unlogged one. */
  start: (start: {
    exercise: IntervalTimerExercise;
    rounds: readonly IntervalTimerRound[];
    getReadySec: number;
  }) => void;
  /** Moves the timer on to the phase running now; changes nothing when it is already there. */
  catchUp: () => void;
  pause: () => void;
  resume: () => void;
  skipRest: () => void;
  /** End early, once the user confirmed it. */
  endEarly: () => void;
  /** Puts the timer away — Back to workout, or after End early. */
  close: () => void;
};

export const useIntervalTimerStore = create<IntervalTimerStore>((set) => {
  /** Applies `rule` to the active timer at the current time. */
  const apply = (rule: (timer: IntervalTimer, now: number) => IntervalTimer) =>
    set((s) => {
      if (s.active === null) return s;
      const timer = rule(s.active.timer, Date.now());
      return timer === s.active.timer ? s : { active: { ...s.active, timer } };
    });

  return {
    active: null,
    start: ({ exercise, rounds, getReadySec }) => {
      useRestTimerStore.getState().stop();
      set({ active: { exercise, timer: startIntervalTimer(rounds, getReadySec, Date.now()) } });
    },
    catchUp: () => apply(intervalTimerAt),
    pause: () => apply(pauseIntervalTimer),
    resume: () => apply(resumeIntervalTimer),
    skipRest: () => apply(skipIntervalRest),
    endEarly: () => apply(endIntervalTimerEarly),
    close: () => set({ active: null }),
  };
});
