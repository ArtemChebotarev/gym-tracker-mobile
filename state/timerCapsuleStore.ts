import { create } from 'zustand';

import type { TimerCapsuleProps } from '@design/components/TimerCapsule';

// The one floating timer capsule (10.1 FR-5, FR-6; GT-85). Whoever runs a timer — the rest timer
// after Log (GT-86), later a minimised interval timer — puts what the capsule should show here,
// and components/TimerCapsuleHost draws it over the tab bar. It lives here rather than in the
// screen that started it because the capsule outlasts that screen: switching tabs must not hide
// it (Artem, 18.10.2026), and the tab bar is the one thing every tab shares.
//
// One slot, not a list: only one timer runs at a time (FR-6), so a new one replaces the old. The
// slot knows whose capsule it holds, and a timer takes down only its own (`release`): the rest
// timer's driver lets go whenever it has no rest to show, and must not take a minimised interval
// timer's capsule down with it (GT-97).

/** Who put the capsule up: the rest between sets, or a minimised interval timer. */
export type TimerCapsuleOwner = 'rest' | 'interval';

type TimerCapsuleStore = {
  capsule: TimerCapsuleProps | null;
  owner: TimerCapsuleOwner | null;
  show: (capsule: TimerCapsuleProps, owner: TimerCapsuleOwner) => void;
  /** Takes the capsule down if `owner` put it up; leaves anyone else's. */
  release: (owner: TimerCapsuleOwner) => void;
  /** Takes the capsule down, whoever's it is. */
  clear: () => void;
};

export const useTimerCapsuleStore = create<TimerCapsuleStore>((set) => ({
  capsule: null,
  owner: null,
  show: (capsule, owner) => set({ capsule, owner }),
  release: (owner) => set((s) => (s.owner === owner ? { capsule: null, owner: null } : s)),
  clear: () => set({ capsule: null, owner: null }),
}));

/** Whether a capsule is up — a root screen leaves room for it under its last row. */
export function useTimerCapsuleVisible(): boolean {
  return useTimerCapsuleStore((s) => s.capsule !== null);
}
