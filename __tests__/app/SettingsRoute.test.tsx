// Where Settings → About leads (GT-262). components/SettingsScreen.test.tsx already covers that each
// row fires its callback; this covers what the route does with it: the privacy policy and the
// support page open in the in-app browser sheet, not by leaving for Safari — which is what
// `Linking.openURL` would do, and nothing else on the screen would look different.

import { fireEvent, screen } from '@testing-library/react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';

import SettingsRoute from '@app/(tabs)/settings';
import { renderWithRepositories, withRepositories } from '../fixtures/renderWithRepositories';

const mockOpenBrowser = jest.fn((_url: string) => Promise.resolve({ type: 'cancel' }));
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: (url: string) => mockOpenBrowser(url),
}));

const TEST_SAFE_AREA_METRICS: Metrics = {
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
  frame: { x: 0, y: 0, width: 402, height: 874 },
};

withRepositories();

async function renderRoute() {
  renderWithRepositories(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>
      <SettingsRoute />
    </SafeAreaProvider>,
  );
  await screen.findByText('Privacy Policy');
}

afterEach(() => mockOpenBrowser.mockClear());

describe('Settings route — About', () => {
  test('Privacy Policy opens in the in-app browser', async () => {
    await renderRoute();

    fireEvent.press(screen.getByText('Privacy Policy'));

    expect(mockOpenBrowser).toHaveBeenCalledTimes(1);
    expect(mockOpenBrowser).toHaveBeenCalledWith('https://hyperbro.app/privacy-policy');
  });

  test('Support opens in the in-app browser', async () => {
    await renderRoute();

    fireEvent.press(screen.getByText('Support'));

    expect(mockOpenBrowser).toHaveBeenCalledTimes(1);
    expect(mockOpenBrowser).toHaveBeenCalledWith('https://hyperbro.app/support');
  });
});
