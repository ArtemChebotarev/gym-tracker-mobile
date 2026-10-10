import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { ExpoConfig } from 'expo/config';

import { variantFromEnv, withVariant } from '../app.config';
import { idsMatch, readNativeIds } from './nativeVariant';

// `npm run` pre-hook of every native build: stops a build whose generated `ios/` / `android/`
// carries a different bundle ID from the one the current `APP_VARIANT` asks for. See
// `scripts/nativeVariant.ts` for why the generated project cannot be trusted to follow the config.

const root = process.cwd();
const base = (JSON.parse(readFileSync(join(root, 'app.json'), 'utf8')) as { expo: ExpoConfig })
  .expo;
const variant = variantFromEnv(process.env);
const resolved = withVariant(base, variant);
const label = variant ?? 'the real app';

const found = readNativeIds(root);
const problems: string[] = [];

const expectedIos = resolved.ios?.bundleIdentifier ?? '';
if (!idsMatch(found.ios, expectedIos)) {
  problems.push(`ios/ is generated for ${found.ios?.join(', ')}, but ${label} is ${expectedIos}`);
}
const expectedAndroid = resolved.android?.package ?? '';
if (!idsMatch(found.android, expectedAndroid)) {
  problems.push(
    `android/ is generated for ${found.android?.join(', ')}, but ${label} is ${expectedAndroid}`,
  );
}

if (problems.length > 0) {
  console.error(
    [
      `Refusing to build: ${problems.join('; ')}.`,
      '',
      'A generated native project keeps the bundle ID it was created with — the config is not',
      're-read on later builds. Building anyway would install this code under the other app’s',
      'identity, i.e. on top of its database.',
      '',
      'The hybrid app and the real app each need their own checkout, and so their own ios/:',
      '  git worktree add .claude/worktrees/hybrid hybrid   # once; modules: see README',
      '  npm run ios:device:hybrid                          # there; generates ios/ for hybrid',
      'Do not delete or regenerate this checkout’s ios/ — it carries the signing setup.',
    ].join('\n'),
  );
  process.exit(1);
}
