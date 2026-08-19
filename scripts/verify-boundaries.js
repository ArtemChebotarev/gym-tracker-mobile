// Regression test for the layer-boundary ESLint rules (07 · Persistence Layer Contract, rules 1
// and 9). Lints each intentional-violation fixture in __boundary-fixtures__ and fails if the
// expected `no-restricted-imports` error is not reported — i.e. if a boundary rule ever silently
// stops catching what it's meant to catch.
const { ESLint } = require('eslint');

const FIXTURES = [
  'domain/__boundary-fixtures__/imports-react-native.ts',
  'domain/__boundary-fixtures__/imports-storage.ts',
  'domain/__boundary-fixtures__/imports-app.ts',
  'usecases/__boundary-fixtures__/imports-storage.ts',
  'usecases/__boundary-fixtures__/imports-react-native.ts',
  'app/__boundary-fixtures__/imports-storage.ts',
];

async function main() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(FIXTURES);

  let failures = 0;
  for (const file of FIXTURES) {
    const result = results.find((r) => r.filePath.endsWith(file));
    const caught = result?.messages.some(
      (m) => m.ruleId === 'no-restricted-imports' && m.severity === 2,
    );
    if (caught) {
      console.log(`ok   ${file}`);
    } else {
      failures += 1;
      console.error(`FAIL ${file} — no-restricted-imports did not flag the intended violation`);
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} boundary fixture(s) are no longer caught by the linter.`);
    process.exit(1);
  }
  console.log(`\nAll ${FIXTURES.length} boundary fixtures are correctly flagged.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
