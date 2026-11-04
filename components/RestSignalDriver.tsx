import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { DEFAULT_SIGNALS } from '@domain/signals';
import { dismissRestSignal, setRestSignal, signalRestOverInApp } from '@state/restSignal';
import { useRestTimerStore } from '@state/restTimerStore';
import { useNotificationStatus } from '@state/useRestNotifications';
import { useTimerSettings } from '@state/useTimerSettings';

import { REST_OVER_TITLE, restOverCaption, signalsInApp } from './RestTimerDriverLogic';

// Gives the signal at the end of a rest (state/restSignal; 10.1 FR-5, GT-203, GT-219). The
// notification follows the store, so whatever changes the rest moves it too: a new Log, Pause and
// Resume, Skip, the workout's end, the interval timer taking over. Permission given while a rest
// runs sets it on that rest. With the app open the signal is given here when the rest runs out, by
// the settings as they are at that moment; until they have been read it is as it ships, sound and
// vibration both.
//
// A rest that ran out is left alone: the capsule may turn a moment before the system delivers the
// notification, and calling it off then would lose the signal.
//
// Draws nothing. It sits next to RestTimerDriver in the tab bar's overlay.
export function RestSignalDriver() {
  const signals = useTimerSettings().data?.signals ?? DEFAULT_SIGNALS;
  const notifications = useNotificationStatus();
  const signalsRef = useRef(signals);
  useEffect(() => {
    signalsRef.current = signals;
  }, [signals]);

  const endsAt = useRestTimerStore((s) => s.timer?.endsAt);
  const next = useRestTimerStore((s) => s.timer?.next);
  const ranOut = useRestTimerStore((s) => s.finished !== null);
  const lastEndsAt = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (endsAt !== undefined) {
      lastEndsAt.current = endsAt;
    }
  }, [endsAt]);

  useEffect(() => {
    if (endsAt !== undefined && next !== undefined) {
      const title = REST_OVER_TITLE;
      const body = restOverCaption(next);
      void setRestSignal({ endsAt, title, body });
    } else if (!ranOut) {
      void setRestSignal(null);
    }
  }, [endsAt, next, ranOut, notifications]);

  useEffect(() => {
    const ended = lastEndsAt.current;
    if (ranOut && ended !== undefined && signalsInApp(ended, Date.now(), AppState.currentState)) {
      void signalRestOverInApp(signalsRef.current).catch(() => undefined);
    }
  }, [ranOut]);

  useEffect(() => {
    dismissRestSignal();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') dismissRestSignal();
    });
    return () => appState.remove();
  }, []);

  return null;
}
