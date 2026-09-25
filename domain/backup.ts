// The backup file, as a shape — task 070. On a local-only app this is the only backup there is,
// and the same file is the migration path to a backend (08 · Screens & Navigation, "Настройки":
// "Экспорт в JSON стоит сделать сразу").
//
// Nothing here reads storage or the clock: this module is the format and the one rule that
// decides whether a file can be restored. Producing and consuming it is `usecases/backup.ts`.

import type { Exercise } from './catalog';
import type { Session, SessionExercise, SetLog } from './execution';
import type { Mesocycle } from './mesocycle';
import type { MesoTemplate } from './plan';
import type { Settings } from '@repositories/settings';
import { ConflictError } from './errors';

/**
 * Marks the file as ours, so a JSON that is merely well-formed isn't mistaken for a backup.
 * This string is on disk in every backup already exported, so it keeps the pre-Hybro name:
 * renaming it would make those files unrestorable (task 131).
 */
export const BACKUP_KIND = 'gymtracker-backup' as const;

/**
 * Everything one store holds, by collection. Muscle groups are absent on purpose: they are a
 * fixed enum in the domain (02 · Domain Model), not stored, so there is nothing to carry.
 */
export type BackupData = {
  exercises: Exercise[];
  templates: MesoTemplate[];
  mesocycles: Mesocycle[];
  sessions: Session[];
  sessionExercises: SessionExercise[];
  setLogs: SetLog[];
  settings: Settings;
};

export type BackupFile = {
  kind: typeof BACKUP_KIND;
  /**
   * Which shape the records inside have. It is the stamp of the newest migration the exporting
   * build carried — the same number the migration journal keeps (069), not a second version
   * anyone maintains by hand. A file and a build agree exactly when their stamps match.
   */
  schemaVersion: number;
  /** When the file was written. Informational — nothing decides anything by it. */
  exportedAt: string;
  /**
   * The empty owner slot (07 · Persistence Layer Contract, "Подготовка к backend"). There is no
   * `User` yet, so it is always `null`; importing this set into a server fills it once and the
   * whole set gets an owner in one operation, with no per-record migration.
   */
  owner: null;
  data: BackupData;
};

/**
 * Whether `value` is a backup this build can restore, throwing `ConflictError` with a reason a
 * screen can show when it isn't.
 *
 * The version rule is deliberately exact rather than "anything older": a file from a different
 * schema holds records of a different shape, and migrating *inside* a backup is a mechanism this
 * app does not have. Refusing is the honest answer — the file is intact and a build that matches
 * it can still read it.
 *
 * What is checked is the envelope, not every record: a malformed body fails the import itself,
 * which is transactional and leaves nothing behind (`usecases/backup.ts`). Validating every field
 * twice would be a second copy of the domain's own rules.
 */
export function assertRestorable(value: unknown, schemaVersion: number): asserts value is BackupFile {
  const file = value as Partial<BackupFile> | null;
  if (file === null || typeof file !== 'object' || file.kind !== BACKUP_KIND) {
    throw new ConflictError('This file is not a Hybro backup.');
  }
  if (file.schemaVersion !== schemaVersion) {
    throw new ConflictError(
      `This backup was written by a different version of the app (${String(file.schemaVersion)}; this build reads ${schemaVersion}) and cannot be restored here.`,
    );
  }
  if (typeof file.data !== 'object' || file.data === null) {
    throw new ConflictError('This backup carries no data.');
  }
}
