import { withProgressionSettingsDefaults } from '@domain/mesocycleConverters';
import type { Settings, SettingsRepository } from '@repositories/settings';
import { eq } from 'drizzle-orm';

import { DEFAULT_SETTINGS } from '../settingsDefaults';
import type { SqliteDatabase } from './db';
import { runQuery } from './errors';
import { SETTINGS_ROW_ID, settings } from './schema';

/**
 * Settings is a single global document, not a collection (07 · Persistence Layer Contract), so
 * the table holds one row and this repository is its only writer. An empty table is not an error:
 * it is a store nobody has written settings to yet, and it reads back as the shared defaults.
 */
export class SqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly db: SqliteDatabase) {}

  // Settings written before a `ProgressionSettings` field existed (e.g. `historyLookbackDays`,
  // task 083) read back with the spec default for it filled in.
  async read(): Promise<Settings> {
    const row = await runQuery(() =>
      this.db.select().from(settings).where(eq(settings.id, SETTINGS_ROW_ID)).get(),
    );
    const stored: Settings = row
      ? {
          defaultProgressionSettings: row.defaultProgressionSettings,
          weightUnit: row.weightUnit,
          schemaVersion: row.schemaVersion,
          catalogVersion: row.catalogVersion,
        }
      : DEFAULT_SETTINGS;
    return {
      ...stored,
      defaultProgressionSettings: withProgressionSettingsDefaults(
        stored.defaultProgressionSettings,
      ),
    };
  }

  async write(current: Settings): Promise<Settings> {
    const row = { id: SETTINGS_ROW_ID, ...current };
    await runQuery(() =>
      this.db
        .insert(settings)
        .values(row)
        .onConflictDoUpdate({ target: settings.id, set: row })
        .run(),
    );
    // Read back rather than echoed: what the caller gets is then the stored row, parsed out of
    // the database, and holds no reference into the object it passed in.
    return this.read();
  }
}
