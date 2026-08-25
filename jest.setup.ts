// Mirrors the `--max-warnings=0` policy from ESLint: a runtime warning or
// error logged during a test (e.g. React's "not wrapped in act(...)")
// usually signals a real bug in the component or the test, so it should
// fail the test instead of scrolling past in CI output.
const format = (args: unknown[]) =>
  args.map((arg) => (arg instanceof Error ? arg.stack : String(arg))).join(' ');

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    throw new Error(`console.error was called during a test:\n${format(args)}`);
  });
  jest.spyOn(console, 'warn').mockImplementation((...args) => {
    throw new Error(`console.warn was called during a test:\n${format(args)}`);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});
