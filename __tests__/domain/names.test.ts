import { firstFreeName, isNameEntered, normalizeRequiredName } from '@domain/names';

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

describe('firstFreeName', () => {
  test('keeps the name when no one has it', () => {
    expect(firstFreeName('Upper/Lower', ['Push/Pull'])).toBe('Upper/Lower');
  });

  test('adds " 2" when the name is taken', () => {
    expect(firstFreeName('Upper/Lower', ['Upper/Lower'])).toBe('Upper/Lower 2');
  });

  test('takes the first free suffix, filling a gap rather than going past the highest', () => {
    expect(firstFreeName('Upper/Lower', ['Upper/Lower', 'Upper/Lower 2', 'Upper/Lower 4'])).toBe(
      'Upper/Lower 3',
    );
  });

  test('a suffixed name alone does not take the plain one', () => {
    expect(firstFreeName('Upper/Lower', ['Upper/Lower 2'])).toBe('Upper/Lower');
  });

  test('compares trimmed names, case included', () => {
    expect(firstFreeName(' Upper/Lower ', ['Upper/Lower  '])).toBe('Upper/Lower 2');
    expect(firstFreeName('Upper/Lower', ['upper/lower'])).toBe('Upper/Lower');
  });
});
