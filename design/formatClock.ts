// `m:ss` for a number of seconds — the shape every duration of a hybrid exercise is shown in: the
// round fields and timers of the workout, the Settings timers. One function, so a time never reads `2:00` on one screen and `2 min` on another.

export function formatClock(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
