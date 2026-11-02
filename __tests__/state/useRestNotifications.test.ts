import { Linking, Platform } from 'react-native';

import { openNotificationSettings } from '@state/useRestNotifications';

describe('openNotificationSettings', () => {
  const os = Platform.OS;
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);

  afterEach(() => {
    Platform.OS = os;
    jest.clearAllMocks();
  });

  test('on iOS it opens the app on its notifications', async () => {
    Platform.OS = 'ios';

    await openNotificationSettings();

    expect(openURL).toHaveBeenCalledWith('app-settings:notifications');
    expect(openSettings).not.toHaveBeenCalled();
  });

  test('on Android it opens the app in the system settings', async () => {
    Platform.OS = 'android';

    await openNotificationSettings();

    expect(openSettings).toHaveBeenCalledTimes(1);
    expect(openURL).not.toHaveBeenCalled();
  });
});
