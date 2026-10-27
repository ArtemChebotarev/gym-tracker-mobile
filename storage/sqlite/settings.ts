import { withProgressionSettingsDefaults } from '@domain/mesocycleConverters';
import type { RestBetweenSets } from '@domain/restTimer';
import { DEFAULT_SIGNALS, type Signals } from '@domain/signals';
import type { Settings, SettingsRepository } from '@repositories/settings';
import { eq } from 'drizzle-orm';

import {
  DEFAULT_ONBOARDING,
  DEFAULT_REST_BETWEEN_SETS,
  DEFAULT_SETTINGS,
} from '../settingsDefaults';
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
  // task 083), and onboarding flags that predate a newer flag, read back with the default filled in.
  async read(): Promise<Settings> {
    const row = await runQuery(() =>
      this.db.select().from(settings).where(eq(settings.id, SETTINGS_ROW_ID)).get(),
    );
    const stored: Settings = row
      ? {
          defaultProgressionSettings: row.defaultProgressionSettings,
          weightUnit: row.weightUnit,
          onboarding: row.onboarding,
          restBetweenSets: {
            enabled: row.strengthRestTimerEnabled,
            restSec: row.strengthRestTimerSeconds,
          },
          getReadySec: row.getReadySeconds,
          signals: { sound: row.signalSound, vibration: row.signalVibration },
        }
      : DEFAULT_SETTINGS;
    return {
      ...stored,
      defaultProgressionSettings: withProgressionSettingsDefaults(
        stored.defaultProgressionSettings,
      ),
      onboarding: { ...DEFAULT_ONBOARDING, ...stored.onboarding },
    };
  }

  async write(current: Settings): Promise<Settings> {
    const { restBetweenSets, getReadySec, signals, ...rest } = current;
    // A backup exported before GT-87 has no rest timer, though its schema stamp is this build's:
    // restored, it gets the setting as it ships rather than a write the columns refuse.
    const timer: RestBetweenSets =
      (restBetweenSets as RestBetweenSets | undefined) ?? DEFAULT_REST_BETWEEN_SETS;
    // The same for one exported before GT-172, which has no signals.
    const { sound, vibration } = (signals as Signals | undefined) ?? DEFAULT_SIGNALS;
    const row = {
      id: SETTINGS_ROW_ID,
      ...rest,
      strengthRestTimerEnabled: timer.enabled,
      strengthRestTimerSeconds: timer.restSec,
      getReadySeconds: getReadySec,
      signalSound: sound,
      signalVibration: vibration,
    };
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
