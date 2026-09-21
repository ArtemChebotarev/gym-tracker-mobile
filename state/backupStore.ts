// Composition root for the backup use cases (task 070) — same role as the others in this
// directory, and a function for the same reason: the repository set is installed at startup, not
// at import (task 111).
//
// The schema version comes from the migration bundle, which is also what `state/bootstrap.ts`
// applies — the file records the newest migration this build carries, and nothing maintains a
// second number (069). Importing the bundle pulls in `.sql` modules that only Metro can transform,
// so a test touching this module mocks `@storage/sqlite/migrationBundle`, as the bootstrap's own
// test does.

import { repositories } from '@state/repositories';
import { MIGRATION_BUNDLE } from '@storage/sqlite/migrationBundle';
import { bundleSchemaVersion } from '@storage/sqlite/migrations';
import type { BackupDeps } from '@usecases/backup';

export function backupDeps(): BackupDeps {
  return {
    store: repositories().backupStore,
    schemaVersion: bundleSchemaVersion(MIGRATION_BUNDLE),
  };
}
