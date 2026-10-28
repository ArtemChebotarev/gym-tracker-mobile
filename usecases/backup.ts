// Export and restore the whole local store as one JSON file — task 070. On a local-only app this
// is the only backup there is, and the same file is how the data reaches a backend later
// (08 · Screens & Navigation, "Настройки").
//
// Orchestration only, per usecases/README.md: the file's shape and the one rule about which files
// may be restored live in `domain/backup.ts`; reading and writing go through repositories.

import {
  assertRestorable,
  BACKUP_KIND,
  BackupRefusedError,
  type BackupData,
  type BackupFile,
} from '@domain/backup';
import { nowAsUtcIso } from '@domain/time';
import type { BackupRepositories, BackupStore } from '@repositories/backup';

export type BackupDeps = {
  store: BackupStore;
  /**
   * The schema this build reads and writes — the newest migration it carries (069). The use case
   * is handed the number rather than reaching for it: `usecases` must not know that storage is
   * SQLite, or that migrations exist at all.
   */
  schemaVersion: number;
};

/**
 * Everything in the store, as a file. Sessions, their exercises, their set logs and round logs
 * are walked through the mesocycles that own them — the repositories offer no "all sessions"
 * read, and adding one just for the backup would widen the contract for a single caller. A
 * session that belonged to no mesocycle could not exist: the foreign key forbids it.
 */
export async function exportBackup(
  deps: BackupDeps,
  now: string = nowAsUtcIso(),
): Promise<BackupFile> {
  const {
    exerciseRepo,
    templateRepo,
    mesocycleRepo,
    sessionRepo,
    sessionExerciseRepo,
    setLogRepo,
    roundLogRepo,
    settingsRepo,
  } = deps.store.repos;

  const mesocycles = await mesocycleRepo.getAll();
  const sessions = (
    await Promise.all(mesocycles.map((mesocycle) => sessionRepo.listByMesoId(mesocycle.id)))
  ).flat();
  const sessionExercises = (
    await Promise.all(sessions.map((session) => sessionExerciseRepo.listBySessionId(session.id)))
  ).flat();
  const setLogs = (
    await Promise.all(sessions.map((session) => setLogRepo.listBySessionId(session.id)))
  ).flat();
  const roundLogs = (
    await Promise.all(sessions.map((session) => roundLogRepo.listBySessionId(session.id)))
  ).flat();

  return {
    kind: BACKUP_KIND,
    schemaVersion: deps.schemaVersion,
    exportedAt: now,
    owner: null,
    data: {
      exercises: await exerciseRepo.getAll(),
      templates: await templateRepo.getAll(),
      mesocycles,
      sessions,
      sessionExercises,
      setLogs,
      roundLogs,
      settings: await settingsRepo.read(),
    },
  };
}

/** `exportBackup` as the text that goes into a file. Pretty-printed — a backup is read by people too. */
export async function exportBackupJson(deps: BackupDeps, now?: string): Promise<string> {
  return JSON.stringify(await exportBackup(deps, now), null, 2);
}

/**
 * Restores `file` into a store that holds nothing of the user's, in one transaction.
 *
 * **Nothing of the user's**, not "nothing at all": a freshly installed app already has the
 * exercise catalog, because it arrives as a migration (067(2)) before any screen runs. What must
 * be absent is what the user made — custom exercises, templates, mesocycles. This puts records
 * back under the ids they had, so running it over existing data would collide on the first id
 * that already exists and leave a half-merged store. Refusing up front is the only answer that
 * cannot lose anything; merging two stores is a different feature needing conflict rules this app
 * has not got (07 · Persistence Layer Contract, "Подготовка к backend").
 *
 * Records go in parents first, because foreign keys are enforced (`PRAGMA foreign_keys = ON`):
 * exercises and mesocycles before sessions, sessions before their exercises, those before set
 * logs and round logs. Every record carries its own stamps — `Incoming` accepts them exactly for
 * this, so a restore puts history back as it was written rather than restating it as written
 * today.
 */
export async function importBackup(value: unknown, deps: BackupDeps): Promise<void> {
  assertRestorable(value, deps.schemaVersion);
  const file: BackupFile = value;

  await deps.store.transaction(async (repos) => {
    await assertNothingOfTheUsers(repos);
    await restore(file.data, repos);
  });
}

/** `importBackup` from the text of a file. Malformed JSON is refused the same way a foreign version is. */
export async function importBackupJson(json: string, deps: BackupDeps): Promise<void> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new BackupRefusedError('not-json', 'This file is not valid JSON.', { cause: error });
  }
  return importBackup(parsed, deps);
}

/**
 * The catalog — exercises and templates alike — is deliberately not counted: it is shipped
 * content, identical in every install, and a store that has it is still a store the user has put
 * nothing into.
 */
async function assertNothingOfTheUsers(repos: BackupRepositories): Promise<void> {
  const [exercises, templates, mesocycles] = await Promise.all([
    repos.exerciseRepo.getAll(),
    repos.templateRepo.getAll(),
    repos.mesocycleRepo.getAll(),
  ]);
  const custom = exercises.filter((exercise) => exercise.source === 'custom');
  const customTemplates = templates.filter((template) => template.source === 'custom');
  if (custom.length > 0 || customTemplates.length > 0 || mesocycles.length > 0) {
    throw new BackupRefusedError(
      'has-user-data',
      'A backup can only be restored into a store with no data of your own. Reinstall the app first, then restore.',
    );
  }
}

async function restore(data: BackupData, repos: BackupRepositories): Promise<void> {
  await restoreExercises(data.exercises, repos);
  await restoreTemplates(data.templates, repos);
  for (const mesocycle of data.mesocycles) {
    await repos.mesocycleRepo.create(mesocycle);
  }
  await repos.sessionRepo.createMany(data.sessions);
  await repos.sessionExerciseRepo.createMany(data.sessionExercises);
  for (const setLog of data.setLogs) {
    await repos.setLogRepo.create(setLog);
  }
  for (const roundLog of data.roundLogs) {
    await repos.roundLogRepo.create(roundLog);
  }
  await repos.settingsRepo.write(data.settings);
}

/**
 * The two kinds of exercise come back differently. Custom ones are the user's and are simply
 * written. Catalog ones are already there — the migration put them in — so they go through
 * `seedCatalog`, which inserts only ids that are missing and leaves the rest alone; a backup made
 * by this same build brings exactly the same catalog, so normally nothing is inserted at all.
 *
 * What the catalog rows do carry back is `isHidden`: hiding a catalog exercise is the user's
 * decision (02 · Domain Model, "Записи с `source = catalog` неизменяемы: можно только скрыть"), and
 * it is the one thing about them a restore must not drop. `toggleHidden` is the only way to set it
 * — the repository has no catalog write — so it is called exactly where the stored value differs
 * from the file's.
 */
/**
 * Templates come back the way exercises do: a custom one is the user's and is written under its
 * id; a catalog one is already there, put by the migration, so the only thing it carries back is
 * `isHidden` — hiding it is the user's decision. A catalog template the store does not have (a
 * file from a build that shipped one this build no longer does) is written as it was.
 */
async function restoreTemplates(
  templates: readonly BackupData['templates'][number][],
  repos: BackupRepositories,
): Promise<void> {
  for (const template of templates) {
    if (template.source === 'custom') {
      await repos.templateRepo.create(template);
      continue;
    }
    const stored = await repos.templateRepo.getById(template.id);
    if (stored === null) {
      await repos.templateRepo.create(template);
    } else if (stored.isHidden !== template.isHidden) {
      await repos.templateRepo.update({ ...stored, isHidden: template.isHidden });
    }
  }
}

async function restoreExercises(
  exercises: readonly BackupData['exercises'][number][],
  repos: BackupRepositories,
): Promise<void> {
  const catalog = exercises.filter((exercise) => exercise.source === 'catalog');
  await repos.exerciseRepo.seedCatalog(catalog);
  for (const exercise of exercises.filter((entry) => entry.source === 'custom')) {
    await repos.exerciseRepo.createCustom(exercise);
  }
  for (const exercise of catalog) {
    const stored = await repos.exerciseRepo.getById(exercise.id);
    if (stored !== null && stored.isHidden !== exercise.isHidden) {
      await repos.exerciseRepo.toggleHidden(exercise.id);
    }
  }
}
