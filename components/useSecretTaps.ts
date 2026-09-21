// A door that opens after N taps in a row — the usual way an app keeps a developer screen out of
// everyone's way without hiding it from the person who needs it (Android does this with seven taps
// on the build number). Here it is five taps on the Library screen's title, and behind it is
// `app/debug.tsx` (task 070).
//
// There is no product reason to hide anything from this app's only user; what the door buys is not
// having to design a Settings screen before the backup can be reached (08 · Screens & Navigation
// describes one — defaults, units, export and import — but it does not exist yet). When Settings
// is built, export moves there and this goes away.

import { useCallback, useRef } from 'react';

/** How long a run of taps may pause before it stops counting as one run. */
const RUN_TIMEOUT_MS = 1500;

/**
 * Returns a press handler that calls `onOpen` on the `count`-th tap of an uninterrupted run, then
 * starts over. A pause longer than {@link RUN_TIMEOUT_MS} resets the count, so ordinary taps on
 * the title never accumulate into an accidental open.
 *
 * The count is a ref, not state: nothing on screen changes until the door opens, and re-rendering
 * the screen on every tap of a gesture that usually leads nowhere would be wasted work.
 */
export function useSecretTaps(count: number, onOpen: () => void): () => void {
  const taps = useRef(0);
  const lastAt = useRef(0);

  return useCallback(() => {
    const now = Date.now();
    taps.current = now - lastAt.current > RUN_TIMEOUT_MS ? 1 : taps.current + 1;
    lastAt.current = now;
    if (taps.current >= count) {
      taps.current = 0;
      onOpen();
    }
  }, [count, onOpen]);
}
