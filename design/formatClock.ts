// `m:ss` for a number of seconds — the shape every duration of a hybrid exercise is shown in: the
// fields of the New exercise sheet, the plan chip of the cycle editor (08.5, step 2) and its
// Review. One function, so a time never reads `2:00` on one screen and `2 min` on another.

export function formatClock(totalSec: number): string {
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
