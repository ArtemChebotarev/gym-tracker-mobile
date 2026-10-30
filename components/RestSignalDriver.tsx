import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { DEFAULT_SIGNALS } from '@domain/signals';
import { dismissRestSignal, onRestSignalReceived, setRestSignal } from '@state/restSignal';
import { useRestTimerStore } from '@state/restTimerStore';
import { useTimerSettings } from '@state/useTimerSettings';

import { REST_OVER_TITLE, restOverCaption } from './RestTimerDriverLogic';

// Keeps the notification at the end of a rest (state/restSignal) in step with the rest (10.1 FR-5,
// GT-203). It follows the store, so whatever changes the rest moves the signal with it: a new Log,
// Pause and Resume, Skip, the workout's end, the interval timer taking over. The settings count as
// they are now: changing them while a rest runs schedules the signal again (GT-172); until they
// have been read it is as it ships, sound and vibration both.
//
// A rest that ran out is left alone: the capsule may turn a moment before the system delivers the
// notification, and calling it off then would lose the signal.
//
// Draws nothing. It sits next to RestTimerDriver in the tab bar's overlay.
export function RestSignalDriver() {
  const signals = useTimerSettings().data?.signals ?? DEFAULT_SIGNALS;
  const { sound, vibration } = signals;
  const signalsRef = useRef(signals);
  useEffect(() => {
    signalsRef.current = signals;
  }, [signals]);

  const endsAt = useRestTimerStore((s) => s.timer?.endsAt);
  const next = useRestTimerStore((s) => s.timer?.next);
  const ranOut = useRestTimerStore((s) => s.finished !== null);

  useEffect(() => {
    if (endsAt !== undefined && next !== undefined) {
      const title = REST_OVER_TITLE;
      const body = restOverCaption(next);
      void setRestSignal({ endsAt, title, body, signals: { sound, vibration } });
    } else if (!ranOut) {
      void setRestSignal(null);
    }
  }, [endsAt, next, ranOut, sound, vibration]);

  useEffect(() => {
    const unlisten = onRestSignalReceived(() => signalsRef.current);
    dismissRestSignal();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') dismissRestSignal();
    });
    return () => {
      unlisten();
      appState.remove();
    };
  }, []);

  return null;
}
