import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

import type { Signals } from '@domain/signals';

// The signal at the end of a rest (10.1 FR-5, GT-86, GT-203): a soft low "bong", the sound Artem
// picked (18.10.2026). It is one local notification, scheduled for the moment the rest ends, and
// nothing else: a suspended app runs no JS, so a signal given from the app came only when the app
// was opened again. The system delivers this one wherever the user is.
//
// - **The app open:** the sound alone, no banner and nothing left in the list (the handler below).
// - **In another app, or the screen locked:** the notification as the system shows it. It has one
//   identifier, so a new one takes the place of the one before, and it is taken away when the app
//   comes back (`dismissRestSignal`).
// - **The sound off in Settings (GT-172):** the notification is silent, and iOS does not vibrate
//   for a silent one. So with the app running the vibration comes from here, set off by the
//   notification itself (`onRestSignalReceived`); behind a locked screen it does not come.
// - **Both off:** nothing is scheduled, the capsule's `Rest is over` the only sign.
// - **Notifications not allowed:** no signal. There is no second path through the app (Artem,
//   30.10.2026).
//
// The sound follows the silent switch and mixes with the user's music. The interval timer's sound
// does not go through here (state/intervalSignal.ts).

const REST_OVER_ID = 'rest-over';
const REST_OVER_SOUND = 'rest-over.wav';
/** Android fixes a notification's sound on its channel, so the silent signal has its own. */
const CHANNEL = { sound: 'rest-over', silent: 'rest-over-silent' } as const;
/** A date already passed is refused: a rest that is all but over goes off a moment from now. */
const SOONEST_MS = 1000;

/** The rest to signal the end of. */
export type RestSignal = { endsAt: number; title: string; body: string; signals: Signals };

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    }),
});

async function makeChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  const channel = { name: 'Rest timer', importance: Notifications.AndroidImportance.HIGH };
  await Notifications.setNotificationChannelAsync(CHANNEL.sound, {
    ...channel,
    sound: REST_OVER_SOUND,
  });
  await Notifications.setNotificationChannelAsync(CHANNEL.silent, { ...channel, sound: null });
}

/** Asks the first time a rest needs it, not at launch: the user has just seen what it is for. */
async function notificationsAllowed(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status !== Notifications.PermissionStatus.UNDETERMINED) {
    return current.granted;
  }
  const asked = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return asked.granted;
}

async function schedule({ endsAt, title, body, signals }: RestSignal): Promise<void> {
  if (!signals.sound && !signals.vibration) {
    await Notifications.cancelScheduledNotificationAsync(REST_OVER_ID);
    return;
  }
  await makeChannels();
  if (!(await notificationsAllowed())) {
    return;
  }
  await Notifications.scheduleNotificationAsync({
    identifier: REST_OVER_ID,
    content: { title, body, sound: signals.sound ? REST_OVER_SOUND : false },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: Math.max(endsAt, Date.now() + SOONEST_MS),
      channelId: signals.sound ? CHANNEL.sound : CHANNEL.silent,
    },
  });
}

let queue: Promise<void> = Promise.resolve();

/**
 * Schedules the signal of `rest`, in place of any set before, or with `null` calls it off. The calls
 * go one after another, each catching its own failure: a Skip during the permission prompt must
 * land after the schedule it follows, and one refused call must not stop the ones after it.
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

/**
 * Gives the vibration a silent signal cannot, each time the signal arrives with the app running.
 * `signals` is asked at that moment. Returns the unsubscribe.
 */
export function onRestSignalReceived(signals: () => Signals): () => void {
  const subscription = Notifications.addNotificationReceivedListener((notification) => {
    const { sound, vibration } = signals();
    if (notification.request.identifier === REST_OVER_ID && !sound && vibration) {
      Vibration.vibrate();
    }
  });
  return () => subscription.remove();
}
