import { setAudioModeAsync } from 'expo-audio';
import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

import type { Signals } from '@domain/signals';
import {
  dismissRestSignal,
  readNotificationStatus,
  requestNotificationPermission,
  setRestSignal,
  signalRestOverInApp,
  type RestSignal,
} from '@state/restSignal';

const NOW = 1_000_000;
const REST: RestSignal = {
  endsAt: NOW + 60_000,
  title: 'Rest is over',
  body: 'Set 2 next',
};

const schedule = jest.mocked(Notifications.scheduleNotificationAsync);
const cancel = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getPermissions = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissions = jest.mocked(Notifications.requestPermissionsAsync);
const channels = jest.mocked(Notifications.setNotificationChannelAsync);

type Permissions = Awaited<ReturnType<typeof Notifications.getPermissionsAsync>>;

const permissions = (status: string, granted: boolean) => ({ status, granted }) as Permissions;

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('the notification handler', () => {
  test('with the app open the notification is neither heard nor seen: the app gives the signal', async () => {
    // Set when the module loads, before `clearAllMocks` runs for the first test.
    jest.isolateModules(() => {
      jest.requireActual<typeof import('@state/restSignal')>('@state/restSignal');
    });

    const handler = jest.mocked(Notifications.setNotificationHandler).mock.lastCall?.[0];
    const behaviour = await handler?.handleNotification({} as Notifications.Notification);

    expect(behaviour).toEqual({
      shouldPlaySound: false,
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

  test('a rest all but over goes off a moment from now, not at a date already gone', async () => {
    await setRestSignal({ ...REST, endsAt: NOW + 100 });

    expect(schedule.mock.lastCall?.[0].trigger).toMatchObject({ date: NOW + 1000 });
  });

  test('null calls the signal off', async () => {
    await setRestSignal(null);

    expect(cancel).toHaveBeenCalledWith('rest-over');
    expect(schedule).not.toHaveBeenCalled();
  });

  test.each([
    ['undetermined', false],
    ['denied', false],
  ] as const)('with the permission %s it neither asks nor schedules', async (status, granted) => {
    getPermissions.mockResolvedValueOnce(permissions(status, granted));

    await setRestSignal(REST);

    expect(requestPermissions).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
  });

  test('a Skip lands after the schedule it follows', async () => {
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

  test('makes its channel on Android', async () => {
    const os = Platform.OS;
    Platform.OS = 'android';

    await setRestSignal(REST);
    Platform.OS = os;

    expect(channels.mock.calls.map(([id]) => id)).toEqual(['rest-over']);
  });
});

describe('dismissRestSignal', () => {
  test('takes the delivered signal away', () => {
    dismissRestSignal();

    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith('rest-over');
  });
});

describe('signalRestOverInApp', () => {
  let vibrate: jest.SpyInstance;

  beforeEach(() => {
    vibrate = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vibrate.mockRestore();
  });

  test.each<[string, Signals, number, boolean]>([
    ['both on', { sound: true, vibration: true }, 1, true],
    ['the sound alone', { sound: true, vibration: false }, 0, true],
    ['the vibration alone', { sound: false, vibration: true }, 1, false],
    ['both off', { sound: false, vibration: false }, 0, false],
  ])('%s', async (_name, signals, vibrations, plays) => {
    await signalRestOverInApp(signals);

    expect(vibrate).toHaveBeenCalledTimes(vibrations);
    expect(setAudioModeAsync).toHaveBeenCalledTimes(plays ? 1 : 0);
  });

  test('plays through the silent switch, mixed with the music', async () => {
    await signalRestOverInApp({ sound: true, vibration: false });

    expect(setAudioModeAsync).toHaveBeenCalledWith(
      expect.objectContaining({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }),
    );
  });

  test('needs no permission', async () => {
    await signalRestOverInApp({ sound: true, vibration: true });

    expect(getPermissions).not.toHaveBeenCalled();
  });
});

describe('the permission', () => {
  test.each([
    ['undetermined', false, 'undetermined'],
    ['granted', true, 'granted'],
    ['denied', false, 'denied'],
  ] as const)('reads %s', async (status, granted, expected) => {
    getPermissions.mockResolvedValueOnce(permissions(status, granted));

    await expect(readNotificationStatus()).resolves.toBe(expected);
  });

  test('asks only when asked to, and answers with the new status', async () => {
    requestPermissions.mockResolvedValueOnce(permissions('denied', false));

    await expect(requestNotificationPermission()).resolves.toBe('denied');
    expect(requestPermissions).toHaveBeenCalledTimes(1);
  });
});
