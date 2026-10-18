import { create } from 'zustand';

import type { TimerCapsuleProps } from '@design/components/TimerCapsule';

// The one floating timer capsule (10.1 FR-5, FR-6; GT-85). Whoever runs a timer — the rest timer
// after Log (GT-86), later a minimised interval timer — puts what the capsule should show here,
// and components/TimerCapsuleHost draws it over the tab bar. It lives here rather than in the
// screen that started it because the capsule outlasts that screen: switching tabs must not hide
// it (Artem, 18.10.2026), and the tab bar is the one thing every tab shares.
//
// One slot, not a list: only one timer runs at a time (FR-6), so a new one replaces the old.
type TimerCapsuleStore = {
  capsule: TimerCapsuleProps | null;
  show: (capsule: TimerCapsuleProps) => void;
  clear: () => void;
};

export const useTimerCapsuleStore = create<TimerCapsuleStore>((set) => ({
  capsule: null,
  show: (capsule) => set({ capsule }),
  clear: () => set({ capsule: null }),
}));

/** Whether a capsule is up — a root screen leaves room for it under its last row. */
export function useTimerCapsuleVisible(): boolean {
  return useTimerCapsuleStore((s) => s.capsule !== null);
}
