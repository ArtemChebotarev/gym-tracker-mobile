import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { ExpoConfig } from 'expo/config';

import appJson from '../../app.json';
import { variantFromEnv, withVariant } from '../../app.config';
import {
  androidApplicationIds,
  idsMatch,
  iosBundleIds,
  readNativeIds,
} from '../../scripts/nativeVariant';

const base = appJson.expo as ExpoConfig;

describe('variantFromEnv', () => {
  it('is the real app when APP_VARIANT is unset or empty', () => {
    expect(variantFromEnv({})).toBeUndefined();
    expect(variantFromEnv({ APP_VARIANT: '' })).toBeUndefined();
  });

  it('knows the hybrid variant', () => {
    expect(variantFromEnv({ APP_VARIANT: 'hybrid' })).toBe('hybrid');
  });

  it('refuses a name it does not know instead of building the real app', () => {
    expect(() => variantFromEnv({ APP_VARIANT: 'hybird' })).toThrow(/Unknown APP_VARIANT "hybird"/);
  });
});

describe('withVariant', () => {
  it('leaves app.json untouched for the real app', () => {
    expect(withVariant(base, undefined)).toBe(base);
  });

  it('gives hybrid its own bundle ID, application ID, name and scheme', () => {
    const hybrid = withVariant(base, 'hybrid');
    expect(hybrid.ios?.bundleIdentifier).toBe(`${base.ios?.bundleIdentifier}.hybrid`);
    expect(hybrid.android?.package).toBe(`${base.android?.package}.hybrid`);
    expect(hybrid.name).not.toBe(base.name);
    expect(hybrid.scheme).toBe(`${base.scheme}-hybrid`);
  });

  it('keeps everything else of app.json', () => {
    const hybrid = withVariant(base, 'hybrid');
    expect(hybrid.slug).toBe(base.slug);
    expect(hybrid.version).toBe(base.version);
    expect(hybrid.plugins).toEqual(base.plugins);
    expect(hybrid.ios?.supportsTablet).toBe(base.ios?.supportsTablet);
  });

  it('refuses a config it cannot derive IDs from', () => {
    expect(() => withVariant({ name: 'x', slug: 'x' }, 'hybrid')).toThrow(/bundleIdentifier/);
  });
});

describe('reading the generated native projects', () => {
  it('collects the distinct bundle IDs of an Xcode project', () => {
    const pbxproj = `
      PRODUCT_BUNDLE_IDENTIFIER = "com.anonymous.gym-tracker-mobile";
      PRODUCT_BUNDLE_IDENTIFIER = "com.anonymous.gym-tracker-mobile";
      PRODUCT_BUNDLE_IDENTIFIER = com.example.plain;
    `;
    expect(iosBundleIds(pbxproj)).toEqual([
      'com.anonymous.gym-tracker-mobile',
      'com.example.plain',
    ]);
  });

  it('collects the application IDs of a build.gradle', () => {
    const gradle = `defaultConfig {\n    applicationId 'com.anonymous.gymtrackermobile'\n}`;
    expect(androidApplicationIds(gradle)).toEqual(['com.anonymous.gymtrackermobile']);
  });

  it('matches an absent project, an empty one, and the expected ID only', () => {
    expect(idsMatch(null, 'a.b')).toBe(true);
    expect(idsMatch([], 'a.b')).toBe(true);
    expect(idsMatch(['a.b'], 'a.b')).toBe(true);
    expect(idsMatch(['a.b.hybrid'], 'a.b')).toBe(false);
    expect(idsMatch(['a.b', 'a.b.hybrid'], 'a.b')).toBe(false);
  });

  describe('on disk', () => {
    let root: string;

    beforeEach(() => {
      root = mkdtempSync(join(tmpdir(), 'native-variant-'));
    });

    afterEach(() => {
      rmSync(root, { recursive: true, force: true });
    });

    it('reports null for a project that has not been generated', () => {
      expect(readNativeIds(root)).toEqual({ ios: null, android: null });
    });

    it('reads the IDs of generated ios/ and android/ projects', () => {
      mkdirSync(join(root, 'ios', 'Hybro.xcodeproj'), { recursive: true });
      writeFileSync(
        join(root, 'ios', 'Hybro.xcodeproj', 'project.pbxproj'),
        'PRODUCT_BUNDLE_IDENTIFIER = "com.anonymous.gym-tracker-mobile";',
      );
      mkdirSync(join(root, 'android', 'app'), { recursive: true });
      writeFileSync(
        join(root, 'android', 'app', 'build.gradle'),
        `applicationId "com.anonymous.gymtrackermobile.hybrid"`,
      );
      expect(readNativeIds(root)).toEqual({
        ios: ['com.anonymous.gym-tracker-mobile'],
        android: ['com.anonymous.gymtrackermobile.hybrid'],
      });
    });
  });
});
