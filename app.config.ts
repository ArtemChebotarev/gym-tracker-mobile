import type { ConfigContext, ExpoConfig } from 'expo/config';

// `app.json` stays the one static config; this file only overlays a build *variant* on top of it
// (GT-68). Without `APP_VARIANT` the result is `app.json` untouched — the real app, with the
// real bundle ID that holds the real training data on the phone.
//
// Why a variant at all: the `hybrid` branch (AGENTS.md, "Epic Hybrid training") changes the
// stored data model. A database migrated by it is refused by `main`'s build ("version from the
// future"), so it must never meet the real app's database. Another bundle ID is another app with
// its own sandbox on iOS: it installs next to the real one and starts with an empty database.
//
// Self-contained on purpose: Expo loads this file itself, and importing other TypeScript files
// from it needs extra tooling. `scripts/nativeVariant.ts` imports *this* file instead.

export const APP_VARIANTS = ['hybrid'] as const;
export type AppVariant = (typeof APP_VARIANTS)[number];

/** The suffix a variant adds to the bundle ID (iOS) and the application ID (Android). */
export const VARIANT_ID_SUFFIX = '.hybrid';

/**
 * The variant `env` asks for, `undefined` for the real app. An unknown name throws rather than
 * falling back: a typo that silently built the real bundle ID is the one mistake this exists to
 * prevent.
 */
export function variantFromEnv(env: Record<string, string | undefined>): AppVariant | undefined {
  const requested = env.APP_VARIANT;
  if (requested === undefined || requested === '') {
    return undefined;
  }
  const known = APP_VARIANTS.find((variant) => variant === requested);
  if (known === undefined) {
    throw new Error(
      `Unknown APP_VARIANT "${requested}". Expected one of: ${APP_VARIANTS.join(', ')} — or unset for the real app.`,
    );
  }
  return known;
}

/** `config` with the variant's overrides applied; `config` itself when there is no variant. */
export function withVariant(config: ExpoConfig, variant: AppVariant | undefined): ExpoConfig {
  if (variant === undefined) {
    return config;
  }
  const bundleIdentifier = config.ios?.bundleIdentifier;
  const androidPackage = config.android?.package;
  if (bundleIdentifier === undefined || androidPackage === undefined) {
    throw new Error(
      'app.json must set ios.bundleIdentifier and android.package to derive a variant.',
    );
  }
  return {
    ...config,
    // The display name on the home screen. It also names the generated native project, so it
    // stays plain ASCII.
    name: 'Hybro Beta',
    // Deep links of the two apps must not collide, or a link opens whichever installed last.
    scheme: typeof config.scheme === 'string' ? `${config.scheme}-${variant}` : config.scheme,
    ios: { ...config.ios, bundleIdentifier: `${bundleIdentifier}${VARIANT_ID_SUFFIX}` },
    android: { ...config.android, package: `${androidPackage}${VARIANT_ID_SUFFIX}` },
  };
}

export default ({ config }: ConfigContext): ExpoConfig =>
  withVariant(config as ExpoConfig, variantFromEnv(process.env));
