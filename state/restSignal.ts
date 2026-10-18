import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';

// The signal at the end of a rest (10.1 FR-5, GT-86): a vibration and a soft low "bong", the sound
// Artem picked (18.10.2026). `assets/sounds/countdown-tick.wav`, the tick an octave above it, is
// there for the interval timer's countdown (FR-6) — the rest timer has none.
//
// The sound mixes with whatever is already playing rather than stopping it — at the gym that is
// the user's music, and a rest timer that paused it every two minutes would be switched off. It
// follows the silent switch, as a notification would; the vibration comes either way.
//
// The player is made on the first rest that runs out, not at startup, and kept: a rest every few
// minutes is not worth reloading the sound for, and an app that never rests never loads it.

const REST_OVER_SOUND = require('../assets/sounds/rest-over.wav');

let player: AudioPlayer | null = null;

function restOverPlayer(): AudioPlayer {
  if (player === null) {
    void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
    player = createAudioPlayer(REST_OVER_SOUND);
  }
  return player;
}

/** Tells the user the rest is over: one vibration and the sound from the start. */
export function signalRestOver(): void {
  Vibration.vibrate();
  const sound = restOverPlayer();
  void sound.seekTo(0);
  sound.play();
}
