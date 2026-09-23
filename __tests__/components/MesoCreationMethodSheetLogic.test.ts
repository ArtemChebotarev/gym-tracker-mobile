import { copyMethodCaption } from '@components/MesoCreationMethodSheetLogic';

describe('copyMethodCaption', () => {
  test('says what copying is for when there is something to copy', () => {
    expect(copyMethodCaption(true)).toBe("Start from a week you've already trained");
  });

  // The row is greyed out in this case, so its line has to carry the reason — and name the way
  // out of it, not just state the fact.
  test('says why the row is off, and what makes it work', () => {
    expect(copyMethodCaption(false)).toBe('Nothing to copy yet — finish a mesocycle first');
  });
});
