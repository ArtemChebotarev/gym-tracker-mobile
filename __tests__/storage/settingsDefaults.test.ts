import { settings } from '@storage/sqlite/schema';
import { DEFAULT_ONBOARDING } from '@storage/settingsDefaults';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// `settings.onboarding` is a JSON document the code defaults on read (storage/README.md, "JSON
// columns the code fills in itself"). Its DDL default is frozen into migration 0003 and nothing at
// runtime reads it; `DEFAULT_ONBOARDING` is the source of truth and grows. These tests keep the two
// from drifting in the ways that matter: the schema's default has to be the one that shipped (or
// the next `npm run migration` plans to recreate `settings`), and the constant has to keep every
// key that default names (or a flag removed from it would be dropped from a row silently).

/** The default migration 0003 gave the column, read from the migration itself. */
function shippedOnboardingDefault(): Record<string, boolean> {
  const sql = readFileSync(
    join(__dirname, '../../drizzle/0003_onboarding_flags.sql'),
    'utf8',
  );
  const match = /DEFAULT '(\{.*?\})'/.exec(sql);
  if (match === null) {
    throw new Error('Migration 0003 no longer names a DEFAULT for settings.onboarding.');
  }
  return JSON.parse(match[1]!) as Record<string, boolean>;
}

describe('the settings.onboarding column default', () => {
  test('stay the one migration 0003 shipped, not the constant that has grown since', () => {
    const column = getTableConfig(settings).columns.find((c) => c.name === 'onboarding');

    expect(column?.default).toEqual(shippedOnboardingDefault());
  });

  test('be covered by the constant the repository fills missing flags from', () => {
    expect(DEFAULT_ONBOARDING).toMatchObject(shippedOnboardingDefault());
  });
});
