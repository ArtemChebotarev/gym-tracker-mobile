import PostHog from 'posthog-react-native';

import { createPostHogTelemetryClient } from '@state/posthogTelemetryClient';

jest.mock('posthog-react-native', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ capture: jest.fn() })),
}));

const PostHogMock = PostHog as unknown as jest.Mock;

describe('createPostHogTelemetryClient', () => {
  // The privacy labels are written against this: nothing is collected that we did not name.
  test('turns off everything the SDK would collect on its own', () => {
    createPostHogTelemetryClient('phc_key');

    expect(PostHogMock).toHaveBeenCalledWith(
      'phc_key',
      expect.objectContaining({
        host: 'https://eu.i.posthog.com',
        captureAppLifecycleEvents: false,
        enableSessionReplay: false,
        errorTracking: { autocapture: false },
        disableRemoteFeatureFlags: true,
        disableSurveys: true,
        disableGeoip: true,
      }),
    );
  });

  test('passes an event and its properties through to PostHog', () => {
    const client = createPostHogTelemetryClient('phc_key');
    const instance = PostHogMock.mock.results.at(-1)?.value as { capture: jest.Mock };

    client.capture('app_opened', { source: 'test' });

    expect(instance.capture).toHaveBeenCalledWith('app_opened', { source: 'test' });
  });
});
