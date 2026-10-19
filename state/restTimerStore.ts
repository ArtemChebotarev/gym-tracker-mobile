import { create } from 'zustand';

import type { FinishedRest, RestNext, RestTimer } from '@domain/restTimer';
import { pauseRestTimer, resumeRestTimer, startRestTimer } from '@domain/restTimerRules';

// The rest between sets (10.1 FR-5, GT-86): the one that is running or paused, and the one that
// just ran out until it is put away. App state, not stored — a rest is minutes long and means
// nothing after the app is closed. Only one timer runs at a time (FR-6), so starting a rest
// replaces whatever was there, finished or not.
//
// It also remembers which sets have been logged in this workout (`loggedSets`), so a set that is
// un-logged and logged again — a correction — doesn't start its rest a second time (Artem,
// 18.10.2026). In memory only: kept until the workout is finished or skipped (`clear`), so it can
// never carry over into another day; an app that was closed in between forgets it, and a re-log
// then starts one extra rest at worst.
//
// The clock is read here, at the moment of each action, and handed to the pure rules in
// `domain/restTimerRules.ts`; tests drive it with Jest's fake timers. What the capsule shows and
// when the rest is over is worked out by components/RestTimerDriver from `timer` and the time.
type RestTimerStore = {
  timer: RestTimer | null;
  finished: FinishedRest | null;
  /** Keys of the sets logged so far in this workout (`loggedSetKey`). */
  loggedSets: ReadonlySet<string>;
  /** Remembers a logged set. */
  noteLogged: (key: string) => void;
  start: (rest: { sessionExerciseId: string; next: RestNext; durationSec: number }) => void;
  pause: () => void;
  resume: () => void;
  /** Skip: the rest is dropped on the spot, and nothing is shown for it. */
  skip: () => void;
  /** The rest ran out: it turns into the "Rest is over" capsule. */
  finish: () => void;
  /** Puts the "Rest is over" capsule away. */
  dismiss: () => void;
  /** No rest follows the set just logged — the workout has nothing left: any rest left is over. */
  stop: () => void;
  /** Drops whatever there is, the logged sets included — the workout it belonged to is over. */
  clear: () => void;
};

export const useRestTimerStore = create<RestTimerStore>((set) => ({
  timer: null,
  finished: null,
  loggedSets: new Set(),
  noteLogged: (key) => set((s) => ({ loggedSets: new Set(s.loggedSets).add(key) })),
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
              next: s.timer.next,
            },
          },
    ),
  dismiss: () => set({ finished: null }),
  stop: () => set({ timer: null, finished: null }),
  clear: () => set({ timer: null, finished: null, loggedSets: new Set() }),
}));
