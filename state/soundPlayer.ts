import type { AudioPlayer } from 'expo-audio';

// Playing a kept player again from a given point — what every signal sound in the app does: the
// rest timer's (state/restSignal.ts) and the interval timer's (state/intervalSignal.ts).
//
// The seek has to finish before `play()`. A player that has played to its end sits there; asked to
// play while its seek back is still on the way, it plays from the end — nothing at all — and the
// seek lands afterwards. On the phone that dropped every other signal (GT-94, 19.10.2026): the
// countdown's "3" played, "2" did not, "1" did.

/** Plays `player` from `positionSec`, once it is really there. */
export async function playFrom(player: AudioPlayer, positionSec: number): Promise<void> {
  await player.seekTo(positionSec);
  player.play();
}
