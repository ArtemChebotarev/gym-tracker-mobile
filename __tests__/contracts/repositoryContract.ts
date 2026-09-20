import { describeCatalogContract } from './catalogContract';
import { describeExerciseHistoryContract } from './exerciseHistoryContract';
import type { RepositoryHarness } from './harness';
import { describeMesocycleContract } from './mesocycleContract';
import { describeSessionContract } from './sessionContract';
import { describeSessionExerciseContract } from './sessionExerciseContract';
import { describeSessionTreeContract } from './sessionTreeContract';
import { describeSetLogContract } from './setLogContract';
import { describeSettingsContract } from './settingsContract';
import { describeTemplateContract } from './templateContract';
import { describeTimestampsContract } from './timestampsContract';
import { describeTransactionContract } from './transactionContract';

/**
 * The repository contract of 07 · Persistence Layer Contract, as a test suite any implementation
 * can be put through (task 109).
 *
 * The suites underneath know nothing about the implementation they exercise: they reach it only
 * through the interfaces in `repositories/`, and they set data up only through those same
 * interfaces — never by reaching into an engine's internals. That is what lets the same
 * expectations run against the in-memory engine today and against the expo-sqlite + Drizzle
 * adapter of task 067 tomorrow, which is how that task's DoD ("весь набор тестов репозиториев
 * проходит на новой реализации без изменений") gets checked instead of asserted.
 *
 * A runner supplies `harness` (see `harness.ts`) and calls this from a `.test.ts` file. Anything
 * specific to one implementation — how legacy rows sit in storage, what happens to a reference
 * that no longer resolves — stays in that implementation's own tests, not here.
 */
export function describeRepositoryContract(
  implementationName: string,
  harness: RepositoryHarness,
): void {
  describe(`${implementationName} · repository contract`, () => {
    describeCatalogContract(harness);
    describeMesocycleContract(harness);
    describeSessionContract(harness);
    describeSessionExerciseContract(harness);
    describeSetLogContract(harness);
    describeSettingsContract(harness);
    describeTemplateContract(harness);
    describeExerciseHistoryContract(harness);
    describeSessionTreeContract(harness);
    describeTransactionContract(harness);
    describeTimestampsContract(harness);
  });
}
