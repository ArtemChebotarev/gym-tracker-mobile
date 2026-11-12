// The app's public pages (GT-244): the privacy policy and the support page that App Store Connect
// asks for, opened from Settings → About. They are `docs/privacy-policy.md` and `docs/support.md`
// in this repository, served by GitHub Pages from `/docs` on `main` until a landing page takes
// them over (11 · Promotion & Launch). Moving them means changing these and the two URLs in App
// Store Connect together.

const PAGES_ROOT = 'https://artemchebotarev.github.io/gym-tracker-mobile';

export const PRIVACY_POLICY_URL = `${PAGES_ROOT}/privacy-policy`;

export const SUPPORT_URL = `${PAGES_ROOT}/support`;
