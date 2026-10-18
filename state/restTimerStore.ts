import { create } from 'zustand';

import type { FinishedRest, RestTimer } from '@domain/restTimer';
import { pauseRestTimer, resumeRestTimer, startRestTimer } from '@domain/restTimerRules';

// The rest between sets (10.1 FR-5, GT-86): the one that is running or paused, and the one that
// just ran out until it is put away. App state, not stored — a rest is minutes long and means
// nothing after the app is closed. Only one timer runs at a time (FR-6), so starting a rest
// replaces whatever was there, finished or not.
//
// The clock is read here, at the moment of each action, and handed to the pure rules in
// `domain/restTimerRules.ts`; tests drive it with Jest's fake timers. What the capsule shows and
// when the rest is over is worked out by components/RestTimerDriver from `timer` and the time.
type RestTimerStore = {
  timer: RestTimer | null;
  finished: FinishedRest | null;
  start: (rest: { sessionExerciseId: string; nextSetNumber: number; durationSec: number }) => void;
  pause: () => void;
  resume: () => void;
  /** Skip: the rest is dropped on the spot, and nothing is shown for it. */
  skip: () => void;
  /** The rest ran out: it turns into the "Rest is over" capsule. */
  finish: () => void;
  /** Puts the "Rest is over" capsule away. */
  dismiss: () => void;
  /** Drops whatever there is — the workout it belonged to is over. */
  clear: () => void;
};

export const useRestTimerStore = create<RestTimerStore>((set) => ({
  timer: null,
  finished: null,
  start: (rest) => set({ timer: startRestTimer(rest, Date.now()), finished: null }),
  pause: () => set((s) => (s.timer === null ? s : { timer: pauseRestTimer(s.timer, Date.now()) })),
  resume: () =>
    set((s) => (s.timer === null ? s : { timer: resumeRestTimer(s.timer, Date.now()) })),
  skip: () => set({ timer: null }),
  finish: () =>
    set((s) =>
      s.timer === null
        ? s
        : {
            timer: null,
            finished: {
              sessionExerciseId: s.timer.sessionExerciseId,
              nextSetNumber: s.timer.nextSetNumber,
            },
          },
    ),
  dismiss: () => set({ finished: null }),
  clear: () => set({ timer: null, finished: null }),
}));
