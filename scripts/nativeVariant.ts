import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// What identity the *generated* native projects (`ios/`, `android/`, gitignored) carry, and
// whether it is the one the current `APP_VARIANT` asks for. `expo run:ios` generates `ios/` only
// when it is missing and never re-reads the config afterwards, so a project keeps the bundle ID
// it was born with — and a hybrid build installed under the real app's ID would migrate the real
// database. `scripts/assertNativeVariant.ts` runs this before every native build.

export type NativeIds = {
  /** Bundle IDs found in the iOS project, `null` when there is no `ios/` yet. */
  ios: string[] | null;
  /** Application IDs found in the Android project, `null` when there is no `android/` yet. */
  android: string[] | null;
};

/** The distinct `PRODUCT_BUNDLE_IDENTIFIER` values of an Xcode `project.pbxproj`. */
export function iosBundleIds(pbxproj: string): string[] {
  const ids = [...pbxproj.matchAll(/PRODUCT_BUNDLE_IDENTIFIER\s*=\s*"?([^";\s]+)"?\s*;/g)].map(
    (match) => match[1] ?? '',
  );
  return [...new Set(ids)];
}

/** The distinct `applicationId` values of an app `build.gradle`. */
export function androidApplicationIds(gradle: string): string[] {
  const ids = [...gradle.matchAll(/applicationId\s+["']([^"']+)["']/g)].map(
    (match) => match[1] ?? '',
  );
  return [...new Set(ids)];
}

/** Reads the identities of the generated projects under `root`; `null` for one that is absent. */
export function readNativeIds(root: string): NativeIds {
  const iosDir = join(root, 'ios');
  const projects = existsSync(iosDir)
    ? readdirSync(iosDir).filter((entry) => entry.endsWith('.xcodeproj'))
    : [];
  const pbxprojs = projects
    .map((project) => join(iosDir, project, 'project.pbxproj'))
    .filter((file) => existsSync(file));
  const gradle = join(root, 'android', 'app', 'build.gradle');
  return {
    ios:
      pbxprojs.length === 0
        ? null
        : [...new Set(pbxprojs.flatMap((file) => iosBundleIds(readFileSync(file, 'utf8'))))],
    android: existsSync(gradle) ? androidApplicationIds(readFileSync(gradle, 'utf8')) : null,
  };
}

/**
 * Whether a generated project's IDs are the expected one. An absent project is fine — it will be
 * generated from the current config — and so is an unreadable one (no IDs found): refusing on
 * something this check cannot see would only train people to bypass it.
 */
export function idsMatch(found: string[] | null, expected: string): boolean {
  return found === null || found.length === 0 || found.every((id) => id === expected);
}
