import { domainAliasSmokeValue } from '@domain/aliasSmoke';

describe('test runner setup', () => {
  test('jest runs and the @domain/* path alias resolves', () => {
    expect(domainAliasSmokeValue).toBe('domain-alias-ok');
  });
});
