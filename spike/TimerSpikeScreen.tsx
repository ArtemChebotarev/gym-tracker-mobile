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

type Run = { index: number; phaseStartMs: number; pausedAtMs?: number; lastBeepSec?: number };

const SILENCE = require('../assets/sounds/silence.wav');
const TICK = require('../assets/sounds/countdown-tick.wav');
const BONG = require('../assets/sounds/rest-over.wav');

function log(...args: unknown[]) {
  console.log(
    `[spike ${new Date().toISOString().slice(11, 19)}] [${AppState.currentState}]`,
    ...args,
  );
}

export function TimerSpikeScreen() {
  const run = useRef<Run | null>(null);
  const activity = useRef<LiveActivity<TimerSpikeProps> | null>(null);
  const players = useRef<{ silence: AudioPlayer; tick: AudioPlayer; bong: AudioPlayer } | null>(
    null,
  );
  const [label, setLabel] = useState('idle');

  function props(r: Run): TimerSpikeProps {
    const phase = phaseAt(r.index);
    return {
      phase: phase.name,
      round: `Round ${phase.round} of 3`,
      startedAtMs: r.phaseStartMs,
      endsAtMs: r.phaseStartMs + phase.durSec * 1000,
      pausedAtMs: r.pausedAtMs,
      canSkipRest: phase.name === 'Rest',
    };
  }

  function publish(r: Run) {
    void activity.current?.update(props(r));
  }

  function play(p: AudioPlayer) {
    void p.seekTo(0);
    p.play();
  }

  function enterPhase(index: number, now: number) {
    if (index >= PHASES.length) {
      log('done');
      Vibration.vibrate();
      if (players.current) play(players.current.bong);
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
    if (players.current) play(players.current.bong);
    publish(run.current);
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
  }

  function skipRest() {
    const r = run.current;
    if (r === null || phaseAt(r.index).name !== 'Rest') return;
    log('skip rest');
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
      if (leftSec <= 3 && r.lastBeepSec !== leftSec) {
        run.current = { ...r, lastBeepSec: leftSec };
        if (players.current) play(players.current.tick);
        log('beep', leftSec);
      }
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
      players.current = { silence, tick: createAudioPlayer(TICK), bong: createAudioPlayer(BONG) };
    }
    players.current.silence.play();
    const now = Date.now();
    run.current = { index: 0, phaseStartMs: now };
    activity.current = TimerSpikeActivity.start(
      props(run.current),
      'gymtracker-hybrid://timer-spike',
    );
    log('started');
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text style={{ color: 'white', fontSize: 24 }}>{label}</Text>
      <Button title="Start" onPress={() => void start()} />
      <Button title="Pause / resume" onPress={togglePause} />
      <Button title="Skip rest" onPress={skipRest} />
    </View>
  );
}
