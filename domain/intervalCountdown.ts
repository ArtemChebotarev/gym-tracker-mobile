// The countdown before a phase of the interval timer ends (10.1 FR-6: beeps in the last 3 s, a
// signal as work or rest starts). Types and fixed values only; when to start it is worked out in
// `intervalCountdownRules.ts`.
//
// The countdown is one sound clip — ticks at 0, 1 and 2 s, the start signal at 3 s — started once,
// 3 s before the phase ends (GT-94). The gaps between the ticks come from the file, so they can't
// drift with JS timing: three separately played ticks, each set off by a poll of the clock, landed
// late by a different amount each and dropped some outright.

/** How long before a phase ends its countdown starts — the length of the clip up to its signal. */
export const COUNTDOWN_SEC = 3;

/** When to start the countdown clip of a phase, and from where in it. */
export type CountdownStart = {
  /** Milliseconds from now; 0 when the countdown is already due. */
  delayMs: number;
  /**
   * Seconds into the clip to start from: 0 normally; more when less than `COUNTDOWN_SEC` of the
   * phase is left — a short Get ready, or a resume part way through the countdown — so that the
   * signal still lands on the phase's end.
   */
  offsetSec: number;
};
