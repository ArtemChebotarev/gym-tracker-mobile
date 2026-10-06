import { rirExplanation, rirTrack } from '@components/RirExplanationLogic';
import type { PlateTextPart } from '@design/components/PlateRow';

/** A row's text with its strong words kept apart, so a test reads both what it says and what it stresses. */
function readRow(text: readonly PlateTextPart[]): { said: string; strong: string[] } {
  return {
    said: text.map((part) => (typeof part === 'string' ? part : part.strong)).join(''),
    strong: text.flatMap((part) => (typeof part === 'string' ? [] : [part.strong])),
  };
}

describe('rirTrack', () => {
  test('the set you do is solid up to the stop, the reserve is the dashes after it, failure is the end', () => {
    const track = rirTrack(3);

    expect(track.inner).toEqual({ min: 0, max: track.marker });
    expect(track.outer.min).toBe(0);
    expect(track.outer.max).toBeGreaterThan(track.marker);
    expect(track.labels.map((label) => label.text)).toEqual(['Stop here', 'Failure']);
    expect(track.labels[0]?.value).toBe(track.marker);
    expect(track.labels[1]?.value).toBe(track.outer.max);
  });

  test('more reserve is a longer stretch of dashes', () => {
    const lengthOf = (reserve: number) => rirTrack(reserve).outer.max - rirTrack(reserve).marker;

    expect(lengthOf(1)).toBeLessThan(lengthOf(2));
    expect(lengthOf(2)).toBeLessThan(lengthOf(3));
    expect(lengthOf(3)).toBeLessThan(lengthOf(8));
  });

  test('1 and 2 RIR still leave room for both labels — the reserve is a stretch, not a point', () => {
    for (const reserve of [1, 2]) {
      const track = rirTrack(reserve);
      const share = (track.outer.max - track.marker) / track.outer.max;
      // Two labels, each ~60pt wide, centred 3-4 units apart on a ~300pt track: at least ~25%.
      expect(share).toBeGreaterThanOrEqual(0.25);
    }
  });

  test('with no reserve you stop at failure: one point, one label, no dashes', () => {
    const track = rirTrack(0);

    expect(track.outer).toEqual(track.inner);
    expect(track.labels).toEqual([{ value: track.marker, text: 'Failure' }]);
  });

  test('is described for assistive technology in words', () => {
    expect(rirTrack(3).accessibilityLabel).toBe('3 reps in reserve: you stop before failure');
    expect(rirTrack(1).accessibilityLabel).toBe('1 rep in reserve: you stop before failure');
    expect(rirTrack(0).accessibilityLabel).toBe('No reps in reserve: you stop at failure');
  });
});

describe('rirExplanation', () => {
  test('says what N RIR means, with the exercise’s own number, in two theses', () => {
    const text = rirExplanation({ targetRir: 3, isDeload: false, hasRepTarget: true });

    expect(text.title).toBe('3 RIR means 3 reps in reserve');
    expect(text.rows.map((row) => readRow(row.text))).toEqual([
      { said: 'Stop a set when about 3 reps are left.', strong: ['about 3 reps are left'] },
      { said: 'It drops each week; the last one is failure.', strong: ['failure'] },
    ]);
    expect(text.track.marker).toBe(rirTrack(3).marker);
  });

  test('with no rep target yet, adds a third thesis on how to find the reps — with the same number', () => {
    const text = rirExplanation({ targetRir: 3, isDeload: false, hasRepTarget: false });

    expect(text.rows).toHaveLength(3);
    expect(readRow(text.rows[2]!.text)).toEqual({
      said: 'No rep target yet. Do as many reps as it takes to reach 3 RIR and enter them.',
      strong: ['3 RIR'],
    });
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
    expect(readRow(last.rows[0]!.text).said).toContain("can't do another rep");
    expect(last.track.labels).toHaveLength(1);
  });

  test('DoD: a deload week gets its own, shorter text with its own RIR, on the same track', () => {
    const text = rirExplanation({ targetRir: 8, isDeload: true, hasRepTarget: true });

    expect(text.title).toBe('Deload week');
    expect(text.rows.map((row) => readRow(row.text))).toEqual([
      {
        said: "Don't push: aim to finish each set with about 8 reps left.",
        strong: ['about 8 reps left'],
      },
    ]);
    expect(text.track.outer.max).toBeGreaterThan(rirTrack(3).outer.max);
  });
});
