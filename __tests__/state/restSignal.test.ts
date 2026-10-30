import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

import type { Signals } from '@domain/signals';
import {
  dismissRestSignal,
  onRestSignalReceived,
  setRestSignal,
  type RestSignal,
} from '@state/restSignal';

const NOW = 1_000_000;
const REST: RestSignal = {
  endsAt: NOW + 60_000,
  title: 'Rest is over',
  body: 'Set 2 next',
  signals: { sound: true, vibration: true },
};

const schedule = jest.mocked(Notifications.scheduleNotificationAsync);
const cancel = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getPermissions = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissions = jest.mocked(Notifications.requestPermissionsAsync);
const channels = jest.mocked(Notifications.setNotificationChannelAsync);

type Permissions = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

const permissions = (status: string, granted: boolean) => ({ status, granted }) as Permissions;

/** Hands the listener a delivered notification with `identifier`. */
function deliver(identifier: string) {
  const listener = jest.mocked(Notifications.addNotificationReceivedListener).mock.lastCall?.[0];
  listener?.({ request: { identifier } } as Notifications.Notification);
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the notification handler', () => {
  test('with the app open the signal is the sound alone: no banner, nothing left in the list', async () => {
    // Set when the module loads, before `clearAllMocks` runs for the first test.
    jest.isolateModules(() => {
      jest.requireActual<typeof import('@state/restSignal')>('@state/restSignal');
    });

    const handler = jest.mocked(Notifications.setNotificationHandler).mock.lastCall?.[0];
    const behaviour = await handler?.handleNotification({} as Notifications.Notification);

    expect(behaviour).toEqual({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: false,
      shouldShowList: false,
    });
  });
});

describe('setRestSignal', () => {
  test('schedules the signal for the end of the rest, with its sound', async () => {
    await setRestSignal(REST);

    expect(schedule).toHaveBeenCalledWith({
      identifier: 'rest-over',
      content: { title: 'Rest is over', body: 'Set 2 next', sound: 'rest-over.wav' },
      trigger: { type: 'date', date: NOW + 60_000, channelId: 'rest-over' },
    });
  });

  test('uses one identifier, so a new rest takes the place of the one before', async () => {
    await setRestSignal(REST);
    await setRestSignal({ ...REST, endsAt: NOW + 90_000 });

    const identifiers = schedule.mock.calls.map(([request]) => request.identifier);
    expect(identifiers).toEqual(['rest-over', 'rest-over']);
  });

  test('with the sound off the notification is silent', async () => {
    await setRestSignal({ ...REST, signals: { sound: false, vibration: true } });

    expect(schedule.mock.lastCall?.[0]).toMatchObject({
      content: { sound: false },
      trigger: { channelId: 'rest-over-silent' },
    });
  });

  test('with both signals off nothing is scheduled, and one set before is called off', async () => {
    await setRestSignal({ ...REST, signals: { sound: false, vibration: false } });

    expect(schedule).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalledWith('rest-over');
  });

  test('a rest all but over goes off a moment from now, not at a date already gone', async () => {
    await setRestSignal({ ...REST, endsAt: NOW + 100 });

    expect(schedule.mock.lastCall?.[0].trigger).toMatchObject({ date: NOW + 1000 });
  });

  test('null calls the signal off', async () => {
    await setRestSignal(null);

    expect(cancel).toHaveBeenCalledWith('rest-over');
    expect(schedule).not.toHaveBeenCalled();
  });

  test('asks for permission the first time, and schedules once it is given', async () => {
    getPermissions.mockResolvedValueOnce(permissions('undetermined', false));

    await setRestSignal(REST);

    expect(requestPermissions).toHaveBeenCalledTimes(1);
    expect(schedule).toHaveBeenCalledTimes(1);
  });

  test('schedules nothing when permission is refused', async () => {
    getPermissions.mockResolvedValueOnce(permissions('undetermined', false));
    requestPermissions.mockResolvedValueOnce(permissions('denied', false));

    await setRestSignal(REST);

    expect(schedule).not.toHaveBeenCalled();
  });

  test('does not ask again once refused', async () => {
    getPermissions.mockResolvedValueOnce(permissions('denied', false));

    await setRestSignal(REST);

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  test('a Skip during the permission prompt lands after the schedule it follows', async () => {
    let answer: (value: Permissions) => void = () => undefined;
    getPermissions.mockReturnValueOnce(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );

    const first = setRestSignal(REST);
    const skip = setRestSignal(null);
    answer(permissions('granted', true));
    await Promise.all([first, skip]);

    expect(schedule.mock.invocationCallOrder[0]).toBeLessThan(
      cancel.mock.invocationCallOrder[0] ?? 0,
    );
  });

  test('one refused call does not stop the ones after it', async () => {
    schedule.mockRejectedValueOnce(new Error('refused'));

    await setRestSignal(REST);
    await setRestSignal(null);

    expect(cancel).toHaveBeenCalledWith('rest-over');
  });

  test('makes no channels on iOS', async () => {
    await setRestSignal(REST);

    expect(channels).not.toHaveBeenCalled();
  });

  test('makes a channel for each sound on Android, before asking for permission', async () => {
    const os = Platform.OS;
    Platform.OS = 'android';

    await setRestSignal(REST);
    Platform.OS = os;

    expect(channels.mock.calls.map(([id]) => id)).toEqual(['rest-over', 'rest-over-silent']);
    expect(channels.mock.invocationCallOrder[1]).toBeLessThan(
      getPermissions.mock.invocationCallOrder[0] ?? 0,
    );
  });
});

describe('dismissRestSignal', () => {
  test('takes the delivered signal away', () => {
    dismissRestSignal();

    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('rest-over');
  });
});

describe('onRestSignalReceived', () => {
  let vibrate: jest.SpyInstance;

  beforeEach(() => {
    vibrate = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vibrate.mockRestore();
  });

  test.each<[string, Signals, number]>([
    ['the sound off, the vibration on: it vibrates', { sound: false, vibration: true }, 1],
    ['the sound on: the notification is the signal', { sound: true, vibration: true }, 0],
    ['the vibration off: nothing', { sound: false, vibration: false }, 0],
  ])('%s', (_name, signals, times) => {
    onRestSignalReceived(() => signals);

    deliver('rest-over');

    expect(vibrate).toHaveBeenCalledTimes(times);
  });

  test('leaves any other notification alone', () => {
    onRestSignalReceived(() => ({ sound: false, vibration: true }));

    deliver('something-else');

    expect(vibrate).not.toHaveBeenCalled();
  });

  test('asks for the signals at the moment it arrives', () => {
    let signals: Signals = { sound: true, vibration: true };
    onRestSignalReceived(() => signals);

    signals = { sound: false, vibration: true };
    deliver('rest-over');

    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  test('stops listening when unsubscribed', () => {
    const remove = jest.fn();
    jest.mocked(Notifications.addNotificationReceivedListener).mockReturnValueOnce({ remove });

    onRestSignalReceived(() => ({ sound: true, vibration: true }))();

    expect(remove).toHaveBeenCalledTimes(1);
  });
});
