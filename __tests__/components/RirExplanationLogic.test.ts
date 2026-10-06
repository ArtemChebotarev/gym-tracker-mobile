import { rirExplanation } from '@components/RirExplanationLogic';

describe('rirExplanation', () => {
  test('says what N RIR means, with the exercise’s own number', () => {
    const text = rirExplanation({ targetRir: 3, isDeload: false, hasRepTarget: true });

    expect(text.title).toBe('3 RIR means 3 reps in reserve');
    expect(text.paragraphs).toEqual([
      'Stop a set when you could do about 3 more. The number drops each week, and in the last one you go to 0.',
    ]);
  });

  test('with no rep target yet, adds how to find the reps — with the same number', () => {
    const text = rirExplanation({ targetRir: 3, isDeload: false, hasRepTarget: false });

    expect(text.paragraphs).toHaveLength(2);
    expect(text.paragraphs[1]).toBe(
      'There is no rep target yet. Do as many reps as it takes to reach 3 RIR and enter them.',
    );
  });

  test('the number follows the week: 2 RIR, 1 RIR in the singular, 0 RIR at the last', () => {
    expect(rirExplanation({ targetRir: 2, isDeload: false, hasRepTarget: true }).title).toBe(
      '2 RIR means 2 reps in reserve',
    );
    expect(rirExplanation({ targetRir: 1, isDeload: false, hasRepTarget: true }).title).toBe(
      '1 RIR means 1 rep in reserve',
    );
    const last = rirExplanation({ targetRir: 0, isDeload: false, hasRepTarget: true });
    expect(last.title).toBe('0 RIR means no reps in reserve');
    expect(last.paragraphs[0]).toContain("can't do another rep");
  });

  test('DoD: a deload week gets its own, shorter text with its own RIR', () => {
    const text = rirExplanation({ targetRir: 8, isDeload: true, hasRepTarget: true });

    expect(text.title).toBe('Deload week');
    expect(text.paragraphs).toEqual([
      "Don't push: aim to finish each set with about 8 reps left.",
    ]);
  });
});
