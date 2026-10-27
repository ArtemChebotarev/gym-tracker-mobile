import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { countdownStart } from '@domain/intervalCountdownRules';

import { playFrom } from './soundPlayer';

// The interval timer's sound (10.1 FR-6), worked out in the GT-94 spike and checked on the phone,
// screen locked included. Nothing here knows about phases: the timer says when a phase ends, this
// makes it heard.
//
// - **The countdown is one clip** (`interval-countdown.wav`: ticks at 0, 1, 2 s from
//   `countdown-tick.wav`, the start signal at 3 s — `rest-over.wav`, the rest timer's), started once
//   by a timeout aimed at 3 s before the phase ends (domain/intervalCountdownRules.ts). Measured
//   late by 17–37 ms, phone and simulator alike — not something an ear catches. Its ticks can't
//   drift apart: the file spaces them.
// - **The timeout is aimed from the clock**, at the phase's end, not set off by a poll that happens
//   to notice the time: a 250 ms poll made every signal late by a different amount.
// - **A silent loop keeps the app awake** while the timer runs. iOS suspends an app soon after the
//   screen locks, and a suspended app neither counts down nor makes a sound — unless it is playing
//   audio. Background audio is on for this (`expo-audio`'s `enableBackgroundPlayback`, app.json).
//   It mixes with the user's music, never stops it.
// - So the session plays in silent mode too: the background audio category that keeps the app
//   awake is the one that ignores the silent switch. The rest timer alone follows the switch
//   (state/restSignal.ts) — while an interval runs, the last mode set wins.
// - **Sound off in Settings (GT-172) silences the countdown**, asked at the moment it is due to
//   sound, so a change made while a phase runs counts for that phase. The silent loop plays on: it
//   is not heard, and the app still has to stay awake.

const COUNTDOWN_SOUND = require('../assets/sounds/interval-countdown.wav');
const SILENCE = require('../assets/sounds/silence.wav');

type Players = { countdown: AudioPlayer; silence: AudioPlayer };

let players: Players | null = null;
let countdownTimeout: ReturnType<typeof setTimeout> | null = null;

function intervalPlayers(): Players {
  if (players === null) {
    const silence = createAudioPlayer(SILENCE);
    silence.loop = true;
    players = { countdown: createAudioPlayer(COUNTDOWN_SOUND), silence };
  }
  return players;
}

/** The timer has started or resumed: from now on the app stays awake behind a locked screen. */
export async function keepAwakeForTimer(): Promise<void> {
  await setAudioModeAsync({
    shouldPlayInBackground: true,
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
  });
  intervalPlayers().silence.play();
}

/** The timer is paused or over: the app may sleep again, and no countdown is left to go off. */
export function releaseTimer(): void {
  cancelCountdown();
  players?.silence.pause();
}

/**
 * Sets the countdown of the running phase to go off so its signal lands on `phaseEndsAt` (epoch
 * ms), if `soundOn` says so when it is due. Replaces any countdown set before — one phase runs at
 * a time. Call it again after a pause, with the new end: it picks up part way into the clip if the
 * countdown has begun.
 */
export function scheduleCountdown(phaseEndsAt: number, soundOn: () => boolean): void {
  cancelCountdown();
  const start = countdownStart(phaseEndsAt, Date.now());
  if (start === null) {
    return;
  }
  countdownTimeout = setTimeout(() => {
    countdownTimeout = null;
    // Worked out again at the moment it goes off: a timeout that fires late still lands the signal
    // on the phase's end, starting further into the clip.
    const due = countdownStart(phaseEndsAt, Date.now());
    if (due !== null && soundOn()) {
      void playFrom(intervalPlayers().countdown, due.offsetSec);
    }
  }, start.delayMs);
}

/** Drops the countdown set for the phase, and stops it if it is already sounding — a pause, a skip. */
export function cancelCountdown(): void {
  if (countdownTimeout !== null) {
    clearTimeout(countdownTimeout);
    countdownTimeout = null;
  }
  players?.countdown.pause();
}
