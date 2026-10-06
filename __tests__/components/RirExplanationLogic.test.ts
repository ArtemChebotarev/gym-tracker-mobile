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

  // The picture must not say "work to 55%" for 3 RIR (it once did, with the reserve padded to fit
  // its labels): the reserve is drawn to the same scale as the set, so 3 RIR is under a quarter.
  test('the reserve is drawn to scale: 3 RIR is under a quarter of the track, 1 RIR a sliver', () => {
    const shareOf = (reserve: number) => {
      const track = rirTrack(reserve);
      return (track.outer.max - track.marker) / track.outer.max;
    };

    expect(shareOf(3)).toBeLessThan(0.25);
    expect(shareOf(3)).toBeGreaterThan(shareOf(2));
    expect(shareOf(2)).toBeGreaterThan(shareOf(1));
    expect(shareOf(1)).toBeGreaterThan(0);
    expect(shareOf(0)).toBe(0);
  });

  // And the labels must not run into each other: 'Stop here' ends at its point instead of being
  // centred on it, so with the reserve small there is room for 'Failure' under the end.
  test('"Stop here" ends at its point, so it never meets "Failure" under the end', () => {
    for (const reserve of [1, 2, 3, 8]) {
      const [stop, failure] = rirTrack(reserve).labels;

      expect(stop).toMatchObject({ text: 'Stop here', align: 'end' });
      expect(failure).toMatchObject({ text: 'Failure' });
      expect(failure?.align).toBeUndefined();
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
    const text = rirExplanation({ targetRir: 3, isDeload: false });

    expect(text.title).toBe('3 RIR means 3 reps in reserve');
    expect(text.rows.map((row) => readRow(row.text))).toEqual([
      { said: 'Stop a set when about 3 reps are left.', strong: ['about 3 reps are left'] },
      { said: 'It drops each week; the last one is failure.', strong: ['failure'] },
    ]);
    expect(text.track.marker).toBe(rirTrack(3).marker);
  });

  // It explains the fact of RIR; how rep targets work is the Reps ⓘ's to say (Artem, 06.10.2026).
  test('never mentions rep targets, whatever week it is', () => {
    for (const targetRir of [3, 2, 1, 0]) {
      const text = rirExplanation({ targetRir, isDeload: false });
      const said = text.rows.map((row) => readRow(row.text).said).join(' ');

      expect(text.rows.length).toBeLessThanOrEqual(2);
      expect(said).not.toMatch(/target/i);
    }
  });

  test('the number follows the week: 2 RIR, 1 RIR in the singular, 0 RIR at the last', () => {
    expect(rirExplanation({ targetRir: 2, isDeload: false }).title).toBe(
      '2 RIR means 2 reps in reserve',
    );
    expect(rirExplanation({ targetRir: 1, isDeload: false }).title).toBe(
      '1 RIR means 1 rep in reserve',
    );
    const last = rirExplanation({ targetRir: 0, isDeload: false });
    expect(last.title).toBe('0 RIR means no reps in reserve');
    expect(readRow(last.rows[0]!.text).said).toContain("can't do another rep");
    expect(last.track.labels).toHaveLength(1);
  });

  test('DoD: a deload week gets its own, shorter text with its own RIR, on the same track', () => {
    const text = rirExplanation({ targetRir: 8, isDeload: true });

    expect(text.title).toBe('Deload week');
    expect(text.rows.map((row) => readRow(row.text))).toEqual([
      {
        said: "Don't push: aim to finish each set with about 8 reps left.",
        strong: ['about 8 reps left'],
      },
    ]);
    // A deload's long reserve is drawn long.
    expect(text.track.outer.max).toBeGreaterThan(rirTrack(3).outer.max);
  });
});
