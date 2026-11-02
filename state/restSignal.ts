import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

import type { Signals } from '@domain/signals';

import { playFrom, TIMER_AUDIO_MODE } from './soundPlayer';

// The signal at the end of a rest (10.1 FR-5, GT-86, GT-203, GT-219): a soft low "bong", the sound
// Artem picked (18.10.2026). Two paths that never meet, split by whether the app is on screen
// (Artem, 02.11.2026, in place of "no second path" of 30.10.2026):
//
// - **The app open:** the app gives it, as `Sound` and `Vibration` in Settings say, and no
//   permission is needed (`signalRestOverInApp`). The notification still fires, and the handler
//   below keeps it silent and out of sight, so there is one signal.
// - **In another app, or the screen locked:** a local notification, scheduled for the moment the
//   rest ends: a suspended app runs no JS, so only the system can deliver it. `Sound` and
//   `Vibration` do not reach it: they are in-app signals, and how a notification sounds is the
//   system's setting. It has one identifier, so a new one takes the place of the one before, and it
//   is taken away when the app comes back (`dismissRestSignal`).
// - **Notifications not allowed:** nothing outside the app. Nothing here asks: the system prompt
//   comes only from the user's own `Turn on` (`requestNotificationPermission`).
//
// In the app the sound plays in silent mode and mixes with the user's music, like the interval
// timer's (state/intervalSignal.ts); the notification follows the silent switch.

const REST_OVER_ID = 'rest-over';
const REST_OVER_SOUND = 'rest-over.wav';
const REST_OVER_ASSET = require('../assets/sounds/rest-over.wav');
/** Android fixes a notification's sound on its channel. */
const CHANNEL = 'rest-over';
/** A date already passed is refused: a rest that is all but over goes off a moment from now. */
const SOONEST_MS = 1000;

/** The rest to signal the end of. */
export type RestSignal = { endsAt: number; title: string; body: string };

/** Whether notifications may be sent: not asked yet, allowed, or refused. */
export type NotificationStatus = 'undetermined' | 'granted' | 'denied';

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
});

let restOverPlayer: AudioPlayer | null = null;

async function makeChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(CHANNEL, {
    name: 'Rest timer',
    importance: Notifications.AndroidImportance.HIGH,
    sound: REST_OVER_SOUND,
  });
}

function statusOf(permissions: Notifications.NotificationPermissionsStatus): NotificationStatus {
  if (permissions.granted) {
    return 'granted';
  }
  return permissions.status === Notifications.PermissionStatus.UNDETERMINED
    ? 'undetermined'
    : 'denied';
}

export async function readNotificationStatus(): Promise<NotificationStatus> {
  return statusOf(await Notifications.getPermissionsAsync());
}

/** The system prompt, for the user's own `Turn on` and nothing else. */
export async function requestNotificationPermission(): Promise<NotificationStatus> {
  await makeChannels();
  return statusOf(
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    }),
  );
}

async function schedule({ endsAt, title, body }: RestSignal): Promise<void> {
  if ((await readNotificationStatus()) !== 'granted') {
    return;
  }
  await makeChannels();
  await Notifications.scheduleNotificationAsync({
    identifier: REST_OVER_ID,
    content: { title, body, sound: REST_OVER_SOUND },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: Math.max(endsAt, Date.now() + SOONEST_MS),
      channelId: CHANNEL,
    },
  });
}

let queue: Promise<void> = Promise.resolve();

/**
 * Schedules the signal of `rest`, in place of any set before, or with `null` calls it off. The calls
 * go one after another, each catching its own failure: a Skip must land after the schedule
 * it follows, and one refused call must not stop the ones after it.
 */
export function setRestSignal(rest: RestSignal | null): Promise<void> {
  queue = queue
    .then(() =>
      rest === null ? Notifications.cancelScheduledNotificationAsync(REST_OVER_ID) : schedule(rest),
    )
    .catch(() => undefined);
  return queue;
}

/** Takes a signal already delivered off the lock screen and out of the list. */
export function dismissRestSignal(): void {
  Notifications.dismissNotificationAsync(REST_OVER_ID).catch(() => undefined);
}

/** The end of a rest with the app on screen, as the in-app signals say. */
export async function signalRestOverInApp({ sound, vibration }: Signals): Promise<void> {
  if (vibration) {
    Vibration.vibrate();
  }
  if (sound) {
    restOverPlayer ??= createAudioPlayer(REST_OVER_ASSET);
    await setAudioModeAsync(TIMER_AUDIO_MODE);
    await playFrom(restOverPlayer, 0);
  }
}
