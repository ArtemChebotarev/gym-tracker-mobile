import { isNameEntered, normalizeRequiredName } from '@domain/names';

describe('isNameEntered', () => {
  test('accepts a name with something in it', () => {
    expect(isNameEntered('Push/Pull')).toBe(true);
    expect(isNameEntered('  Push/Pull  ')).toBe(true);
  });

  test.each(['', '   ', '\t\n'])('rejects whitespace only ("%s")', (name) => {
    expect(isNameEntered(name)).toBe(false);
  });
});

describe('normalizeRequiredName', () => {
  test('trims leading and trailing whitespace', () => {
    expect(normalizeRequiredName('  Push/Pull  ', 'Mesocycle')).toBe('Push/Pull');
  });

  test('names the subject in the error, so the message reads as a sentence', () => {
    expect(() => normalizeRequiredName('  ', 'Mesocycle')).toThrow('Mesocycle name is required.');
    expect(() => normalizeRequiredName('  ', 'Exercise')).toThrow('Exercise name is required.');
  });
});
