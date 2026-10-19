// GT-94 spike, throwaway: does an interval timer keep ticking, beeping and updating its Live
// Activity while the app is in the background or the screen is locked? Reached only by the deep
// link `gymtracker-hybrid://timer-spike`. Every second it logs what it sees, so Metro's log shows
// whether JS ran while the phone was locked.
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { addUserInteractionListener, type LiveActivity } from 'expo-widgets';
import { useEffect, useRef, useState } from 'react';
import { AppState, Button, Text, Vibration, View } from 'react-native';

import TimerSpikeActivity, { type TimerSpikeProps } from './TimerSpikeActivity';

type Phase = { name: 'Get ready' | 'Work' | 'Rest'; durSec: number; round: number };

const PHASES: Phase[] = [
  { name: 'Get ready', durSec: 5, round: 1 },
  { name: 'Work', durSec: 20, round: 1 },
  { name: 'Rest', durSec: 10, round: 1 },
  { name: 'Work', durSec: 20, round: 2 },
  { name: 'Rest', durSec: 10, round: 2 },
  { name: 'Work', durSec: 20, round: 3 },
];

function phaseAt(index: number): Phase {
  return PHASES[index] as Phase;
}

type Run = { index: number; phaseStartMs: number; pausedAtMs?: number };

const SILENCE = require('../assets/sounds/silence.wav');
// One clip for the whole countdown: ticks at 0, 1 and 2 s, the start signal at 3 s. Started once,
// 3 s before the phase ends, so the gaps between the ticks come from the file, not from JS timing.
const COUNTDOWN = require('../assets/sounds/spike-countdown.wav');
const COUNTDOWN_MS = 3000;

/** "0:13" for what is left — rounded up, as the live timer shows it. */
function clockLabel(leftMs: number): string {
  const total = Math.max(0, Math.ceil(leftMs / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function log(...args: unknown[]) {
  console.log(
    `[spike ${new Date().toISOString().slice(11, 19)}] [${AppState.currentState}]`,
    ...args,
  );
}

export function TimerSpikeScreen() {
  const run = useRef<Run | null>(null);
  const activity = useRef<LiveActivity<TimerSpikeProps> | null>(null);
  const players = useRef<{ silence: AudioPlayer; countdown: AudioPlayer } | null>(null);
  const countdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** When the clip was asked to start, and when it should have: for the latency measurement. */
  const pending = useRef<{ targetMs: number; calledMs: number; offsetSec: number } | null>(null);
  const [label, setLabel] = useState('idle');
  const [timing, setTiming] = useState('no countdown yet');

  function props(r: Run): TimerSpikeProps {
    const phase = phaseAt(r.index);
    return {
      phase: phase.name,
      round: `Round ${phase.round} of 3`,
      startedAtMs: r.phaseStartMs,
      endsAtMs: r.phaseStartMs + phase.durSec * 1000,
      pausedLabel:
        r.pausedAtMs === undefined ? undefined : clockLabel(phaseEndMs(r) - r.pausedAtMs),
      canSkipRest: phase.name === 'Rest',
    };
  }

  function publish(r: Run) {
    void activity.current?.update(props(r));
  }

  function phaseEndMs(r: Run): number {
    return r.phaseStartMs + phaseAt(r.index).durSec * 1000;
  }

  function cancelCountdown() {
    if (countdownTimeout.current !== null) clearTimeout(countdownTimeout.current);
    countdownTimeout.current = null;
    players.current?.countdown.pause();
  }

  /** Plays the clip so its start signal lands on `endMs`, from the middle when less than 3 s are left. */
  async function playCountdown(endMs: number) {
    const clip = players.current?.countdown;
    if (clip === undefined) return;
    const targetMs = endMs - COUNTDOWN_MS;
    const offsetSec = Math.max(0, (Date.now() - targetMs) / 1000);
    // The seek has to finish before play(): played at the clip's end, the sound "finishes" at once.
    await clip.seekTo(offsetSec);
    pending.current = { targetMs: targetMs + offsetSec * 1000, calledMs: Date.now(), offsetSec };
    clip.play();
  }

  /** Schedules the countdown of the running phase from the clock — not from the 250 ms poll. */
  function scheduleCountdown(r: Run) {
    cancelCountdown();
    const endMs = phaseEndMs(r);
    const delay = endMs - COUNTDOWN_MS - Date.now();
    countdownTimeout.current = setTimeout(() => void playCountdown(endMs), Math.max(0, delay));
  }

  function enterPhase(index: number, now: number) {
    if (index >= PHASES.length) {
      log('done');
      Vibration.vibrate();
      players.current?.silence.pause();
      void activity.current?.end('default');
      activity.current = null;
      run.current = null;
      setLabel('done');
      return;
    }
    run.current = { index, phaseStartMs: now };
    log('phase', phaseAt(index).name, phaseAt(index).round);
    Vibration.vibrate();
    publish(run.current);
    scheduleCountdown(run.current);
  }

  function togglePause() {
    const r = run.current;
    if (r === null) return;
    const now = Date.now();
    if (r.pausedAtMs === undefined) {
      run.current = { ...r, pausedAtMs: now };
    } else {
      run.current = {
        ...r,
        phaseStartMs: r.phaseStartMs + (now - r.pausedAtMs),
        pausedAtMs: undefined,
      };
    }
    log('pause toggled', run.current.pausedAtMs !== undefined);
    publish(run.current);
    if (run.current.pausedAtMs === undefined) {
      scheduleCountdown(run.current);
    } else {
      cancelCountdown();
    }
  }

  function skipRest() {
    const r = run.current;
    if (r === null || phaseAt(r.index).name !== 'Rest') return;
    log('skip rest');
    cancelCountdown();
    enterPhase(r.index + 1, Date.now());
  }

  useEffect(() => {
    const sub = addUserInteractionListener((event) => {
      log('live activity button', event.target);
      if (event.target === 'pause') togglePause();
      if (event.target === 'skipRest') skipRest();
    });
    const interval = setInterval(() => {
      const r = run.current;
      if (r === null || r.pausedAtMs !== undefined) return;
      const now = Date.now();
      const phase = phaseAt(r.index);
      const leftMs = r.phaseStartMs + phase.durSec * 1000 - now;
      if (leftMs <= 0) {
        enterPhase(r.index + 1, now);
        return;
      }
      const leftSec = Math.ceil(leftMs / 1000);
      setLabel(`${phase.name} ${phase.round} — ${leftSec}s`);
    }, 250);
    const heartbeat = setInterval(() => log('alive'), 5000);
    return () => {
      sub.remove();
      clearInterval(interval);
      clearInterval(heartbeat);
    };
    // The handlers read refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    await setAudioModeAsync({
      shouldPlayInBackground: true,
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
    });
    if (players.current === null) {
      const silence = createAudioPlayer(SILENCE);
      silence.loop = true;
      const countdown = createAudioPlayer(COUNTDOWN, { updateInterval: 50 });
      // The moment the clip really starts playing, against the moment it should have.
      countdown.addListener('playbackStatusUpdate', (status) => {
        const p = pending.current;
        if (p === null || !status.playing) return;
        pending.current = null;
        // Where the clip really started: now, minus what it has already played since the seek.
        const playedMs = (status.currentTime - p.offsetSec) * 1000;
        const startedMs = Date.now() - playedMs;
        const text = `late by ${Math.round(startedMs - p.targetMs)} ms (call ${p.calledMs - p.targetMs} ms)`;
        log('countdown', text);
        setTiming(text);
      });
      players.current = { silence, countdown };
    }
    players.current.silence.play();
    const now = Date.now();
    // A Start while an earlier run is still on the lock screen replaces it, never stacks a second one.
    await Promise.all(TimerSpikeActivity.getInstances().map((old) => old.end('immediate')));
    run.current = { index: 0, phaseStartMs: now };
    scheduleCountdown(run.current);
    activity.current = TimerSpikeActivity.start(
      props(run.current),
      'gymtracker-hybrid://timer-spike',
    );
    log('started');
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text style={{ color: 'white', fontSize: 24 }}>{label}</Text>
      <Text style={{ color: 'white', fontSize: 14 }}>{timing}</Text>
      <Button title="Start" onPress={() => void start()} />
      <Button title="Pause / resume" onPress={togglePause} />
      <Button title="Skip rest" onPress={skipRest} />
    </View>
  );
}
