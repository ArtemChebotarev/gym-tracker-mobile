// The app's public pages (GT-244, GT-266): the privacy policy and the support page that App Store
// Connect asks for, opened from Settings → About. They live in the landing repository
// (hyperbro-landing) and are served at hyperbro.app. Moving them means changing these and the two
// URLs in App Store Connect together.
//
// Versions up to 1.0 still open the old pages — `docs/privacy-policy.md` and `docs/support.md` in
// this repository, on GitHub Pages — which stay until 1.1.0 has rolled out.

const PAGES_ROOT = 'https://hyperbro.app';

export const PRIVACY_POLICY_URL = `${PAGES_ROOT}/privacy-policy`;

export const SUPPORT_URL = `${PAGES_ROOT}/support`;
