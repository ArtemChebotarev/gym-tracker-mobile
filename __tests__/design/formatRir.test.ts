import { formatRir } from '@design/formatRir';

describe('formatRir', () => {
  test('reads `N RIR`', () => {
    expect(formatRir(2)).toBe('2 RIR');
    expect(formatRir(0)).toBe('0 RIR');
  });
});
