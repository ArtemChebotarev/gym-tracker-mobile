import { formatSet } from '@design/formatSet';

describe('formatSet', () => {
  test('renders "{weight} kg × {reps}" with no RIR text', () => {
    const result = formatSet(100, 8);

    expect(result).toBe('100 kg × 8');
    expect(result).not.toMatch(/rir/i);
    expect(result).not.toMatch(/undefined/i);
  });
});
