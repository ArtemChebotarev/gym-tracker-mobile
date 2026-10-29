import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Vibration } from 'react-native';

import type { Signals } from '@domain/signals';

import { playFrom } from './soundPlayer';

// The signal at the end of a rest (10.1 FR-5, GT-86): a vibration and a soft low "bong", the sound
// Artem picked (18.10.2026). The interval timer's countdown (FR-6) is built from it and
// `assets/sounds/countdown-tick.wav`, the tick an octave above it — see state/intervalSignal.ts.
//
// The sound mixes with whatever is already playing rather than stopping it — at the gym that is
// the user's music, and a rest timer that paused it every two minutes would be switched off. It
// follows the silent switch, as a notification would; the vibration comes either way.
//
// The player is made on the first rest that runs out, not at startup, and kept: a rest every few
// minutes is not worth reloading the sound for, and an app that never rests never loads it.
//
// Either half can be switched off in Settings (GT-172); with both off the rest ends in silence,
// the capsule's `Rest is over` the only sign.

const REST_OVER_SOUND = require('../assets/sounds/rest-over.wav');

let player: AudioPlayer | null = null;

function restOverPlayer(): AudioPlayer {
  if (player === null) {
    void setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
    player = createAudioPlayer(REST_OVER_SOUND);
  }
  return player;
}

/**
 * Tells the user the rest is over: one vibration and the sound from the start, each only if its
 * signal is on.
 */
export function signalRestOver({ sound, vibration }: Signals): void {
  if (vibration) Vibration.vibrate();
  if (sound) void playFrom(restOverPlayer(), 0);
}
