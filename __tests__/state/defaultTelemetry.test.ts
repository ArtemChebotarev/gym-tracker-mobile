import { telemetryApiKey } from '@state/defaultTelemetry';

// The PostHog SDK itself is not loaded: which builds send is decided before it is made.
jest.mock('@state/posthogTelemetryClient', () => ({
  createPostHogTelemetryClient: jest.fn(),
}));

describe('telemetryApiKey', () => {
  test('a release build with a key sends with it', () => {
    expect(telemetryApiKey('phc_key', false, false)).toBe('phc_key');
  });

  test('a build without a key stays silent', () => {
    expect(telemetryApiKey(undefined, false, false)).toBeUndefined();
    expect(telemetryApiKey('  ', false, false)).toBeUndefined();
    expect(telemetryApiKey(undefined, true, true)).toBeUndefined();
  });

  test('a development build stays silent even with a key', () => {
    expect(telemetryApiKey('phc_key', true, false)).toBeUndefined();
  });

  test('a development build sends when the local switch asks it to', () => {
    expect(telemetryApiKey('phc_key', true, true)).toBe('phc_key');
  });
});
