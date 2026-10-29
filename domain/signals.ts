// The signals of the timers (10.1 FR-5, FR-6, GT-172): the end of a rest between sets, and the
// start of work and rest in an interval. Types only.

/** How the timers signal, a global setting: a sound, a vibration, each on or off. */
export type Signals = {
  sound: boolean;
  vibration: boolean;
};

/** The signals as they ship: both on. */
export const DEFAULT_SIGNALS: Signals = { sound: true, vibration: true };
