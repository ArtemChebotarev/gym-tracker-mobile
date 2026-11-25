import { PRIVACY_POLICY_URL, SUPPORT_URL } from '@domain/appLinks';

// These two URLs are also entered in App Store Connect; a change here is a change there too.
describe('appLinks', () => {
  test('the privacy policy and the support page are on the landing domain', () => {
    expect(PRIVACY_POLICY_URL).toBe('https://hyperbro.app/privacy-policy');
    expect(SUPPORT_URL).toBe('https://hyperbro.app/support');
  });
});
