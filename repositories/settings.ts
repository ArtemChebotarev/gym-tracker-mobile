import type { ProgressionSettings } from '@domain/mesocycle';

/**
 * Global, app-wide settings. A single record — there is exactly one `Settings`
 * document, not a collection.
 *
 * See 07 · Persistence Layer Contract ("SettingsRepository": "Дефолтные
 * progressionSettings, единицы измерения, версия схемы") and 02 · Domain
 * Model ("catalogVersion хранится в настройках").
 */
export type Settings = {
  /**
   * The `ProgressionSettings` copied into every newly created mesocycle.
   * Changing this does not retroactively affect mesocycles created earlier —
   * see `Mesocycle.progressionSettings` in `domain/mesocycle.ts`.
   */
  defaultProgressionSettings: ProgressionSettings;
  /**
   * Display-only unit preference. Weight is stored in kilograms everywhere in
   * the domain (01 · Scope: "Вес хранится в одной канонической единице (кг)
   * на уровне домена; конвертация — только на отображении") — this field
   * never changes how a weight is stored, only how it is shown.
   */
  weightUnit: 'kg' | 'lb';
  /** Version of the persisted data's shape, for migrations. */
  schemaVersion: number;
  /** Version of the seeded exercise catalog currently applied. */
  catalogVersion: number;
};

/**
 * Access to the single global `Settings` record.
 *
 * See 07 · Persistence Layer Contract, "Hard rules" and "SettingsRepository".
 * All methods are asynchronous per hard rule 1, even though the current
 * (in-memory/local) adapter has no real I/O to await.
 */
export interface SettingsRepository {
  /** Reads the current settings. */
  read(): Promise<Settings>;

  /** Persists the given settings, replacing whatever was stored before. */
  write(settings: Settings): Promise<Settings>;
}
