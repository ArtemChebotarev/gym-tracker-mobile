// Mirrors the `--max-warnings=0` policy from ESLint: a runtime warning or error logged during a
// test (e.g. React's "not wrapped in act(...)") usually signals a real bug in the component or the
// test, so it fails the test instead of scrolling past in CI output.
//
// console.error / console.warn are replaced for the whole run, not spied per test, and they record
// rather than throw:
// - A throw only fails the test when it propagates, and a warning raised inside React's scheduler
//   or a TanStack Query notification is swallowed there instead — the log never fails anything,
//   and the update that triggered it is lost. Recorded logs are checked in afterEach, so the test
//   that caused them fails with the message.
// - A log that lands after a test has ended (a query settling, an animation finishing) used to be
//   printed only: the per-test spies were already restored. Now it's kept too and fails the file in
//   afterAll.
// Rendered trees are unmounted at the end of every test, before the check, so nothing a finished
// test left in flight can update a mounted component later. `cleanupAsync` comes from `/pure`: the
// main entry registers the library's own auto-cleanup, which first yields a macrotask — time enough
// for a query that finished loading to update the screen outside act() — and, imported here, would
// run ahead of this hook. It's awaited: unmounting goes through act(), and a later act() started
// before it finished would overlap it.
//
// Animations jump straight to their end. Under Jest, requestAnimationFrame is a setTimeout(0) loop,
// so a real 250ms slide (the overlay BottomSheet's) keeps updating after the interaction that
// started it — its completion, which unmounts a closed sheet, landing outside act() or after the
// test has moved on. Tests check where things end up, not how they move.

import { cleanupAsync } from '@testing-library/react-native/pure';
import { Animated } from 'react-native';

import { setRepositories } from '@state/repositories';
import { createInMemoryRepositories } from '@storage/repositories';

// The storage the tests run on. The app runs on SQLite since task 111; the in-memory engine stays
// as its test double — the same repositories, passing the same contract (task 109), with no
// native module and no file on disk. Installing it here is the counterpart of what the bootstrap
// does at startup (state/bootstrap.ts), and it happens once per test file: Jest gives each file
// its own module registry, so each gets its own empty storage and no test file can see another's
// rows. A test that needs it filled says what with — see `__tests__/fixtures/appStorage.ts`.
setRepositories(createInMemoryRepositories());

type ConsoleMethod = 'error' | 'warn';
type Logged = { method: ConsoleMethod; message: string };

const format = (args: unknown[]) =>
  args.map((arg) => (arg instanceof Error ? arg.stack : String(arg))).join(' ');

function instantAnimation(
  value: Animated.Value | Animated.ValueXY,
  config: { toValue: unknown },
): Animated.CompositeAnimation {
  return {
    start: (callback) => {
      (value as Animated.Value).setValue(config.toValue as number);
      callback?.({ finished: true });
    },
    stop: () => undefined,
    reset: () => undefined,
  };
}

// Typed read-only, but plain writable properties at runtime.
Object.assign(Animated, { timing: instantAnimation, spring: instantAnimation });

let inTest = false;
let duringTest: Logged[] = [];
const afterTests: Logged[] = [];

for (const method of ['error', 'warn'] as const) {
  console[method] = (...args: unknown[]) => {
    const logged = { method, message: format(args) };
    (inTest ? duringTest : afterTests).push(logged);
  };
}

function describeLogs(logs: readonly Logged[]): string {
  return logs.map(({ method, message }) => `console.${method}: ${message}`).join('\n\n');
}

beforeEach(() => {
  inTest = true;
  duringTest = [];
});

afterEach(async () => {
  await cleanupAsync();
  jest.restoreAllMocks();
  inTest = false;
  const logs = duringTest;
  duringTest = [];
  if (logs.length > 0) {
    throw new Error(`console was called during the test:\n${describeLogs(logs)}`);
  }
});

afterAll(() => {
  if (afterTests.length > 0) {
    throw new Error(`console was called after a test had ended:\n${describeLogs(afterTests)}`);
  }
});
