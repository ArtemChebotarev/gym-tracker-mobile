import { deloadExplanation, rirExplanation, rirTrack } from '@components/RirExplanationLogic';
import type { PlateTextPart } from '@design/components/PlateRow';

/** A row's text with its strong words kept apart, so a test reads both what it says and what it stresses. */
function readRow(text: readonly PlateTextPart[]): { said: string; strong: string[] } {
  return {
    said: text
      .map((part) => (typeof part === 'string' ? part : 'strong' in part ? part.strong : ''))
      .join(''),
    strong: text.flatMap((part) =>
      typeof part !== 'string' && 'strong' in part ? [part.strong] : [],
    ),
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
  const LOG = { said: 'In Reps, log what you actually did.', strong: ['Reps'] };

  test('DoD 149: the coachmark introduces it — the aim, what goes into Reps, how the weeks go', () => {
    const text = rirExplanation({ targetRir: 3, isDeload: false, variant: 'intro' });

    expect(text.title).toBe('3 RIR: stop 3 reps before failure');
    expect(text.rows.map((row) => readRow(row.text))).toEqual([
      {
        said: 'Your target for every set of this exercise: stop with about 3 reps left.',
        strong: ['3 reps left'],
      },
      LOG,
      {
        said: 'Every week gets closer to failure. The last one is a lighter deload.',
        strong: ['deload'],
      },
    ]);
    expect(text.track.marker).toBe(rirTrack(3).marker);
  });

  test('DoD 149: the popover only reminds — same title and track, one row about Reps', () => {
    const intro = rirExplanation({ targetRir: 3, isDeload: false, variant: 'intro' });
    const reminder = rirExplanation({ targetRir: 3, isDeload: false, variant: 'reminder' });

    expect(reminder.title).toBe(intro.title);
    expect(reminder.track).toEqual(intro.track);
    expect(reminder.rows.map((row) => readRow(row.text))).toEqual([LOG]);
  });

  // It explains RIR; how rep targets work is the Reps ⓘ's to say (Artem, 06.10.2026).
  test('never explains rep targets, whatever week it is', () => {
    for (const variant of ['intro', 'reminder'] as const) {
      for (const targetRir of [3, 2, 1, 0]) {
        const said = rirExplanation({ targetRir, isDeload: false, variant })
          .rows.map((row) => readRow(row.text).said)
          .join(' ');

        expect(said).not.toMatch(/target reps|rep target/i);
      }
    }
  });

  test('the number follows the week: 2 RIR, 1 RIR in the singular', () => {
    expect(rirExplanation({ targetRir: 2, isDeload: false, variant: 'intro' }).title).toBe(
      '2 RIR: stop 2 reps before failure',
    );
    const one = rirExplanation({ targetRir: 1, isDeload: false, variant: 'intro' });
    expect(one.title).toBe('1 RIR: stop 1 rep before failure');
    expect(readRow(one.rows[0]!.text).strong).toEqual(['1 rep left']);
  });

  test('DoD 149: 0 RIR goes to failure, in either variant', () => {
    const intro = rirExplanation({ targetRir: 0, isDeload: false, variant: 'intro' });
    expect(intro.title).toBe('0 RIR: go to failure');
    expect(readRow(intro.rows[0]!.text).said).toBe(
      "Your target for every set of this exercise: go until you can't do another rep.",
    );
    expect(intro.rows).toHaveLength(3);
    expect(intro.track.labels).toHaveLength(1);

    const reminder = rirExplanation({ targetRir: 0, isDeload: false, variant: 'reminder' });
    expect(reminder.title).toBe('0 RIR: go to failure');
    expect(reminder.rows.map((row) => readRow(row.text))).toEqual([LOG]);
  });

  test('DoD 149: a deload week says not to push and what goes into Reps, on the same track', () => {
    for (const variant of ['intro', 'reminder'] as const) {
      const text = rirExplanation({ targetRir: 8, isDeload: true, variant });

      expect(text.title).toBe('Deload week');
      expect(text.rows.map((row) => readRow(row.text))).toEqual([
        {
          said: "Don't push: aim to finish each set with about 8 reps left.",
          strong: ['about 8 reps left'],
        },
        LOG,
      ]);
      // A deload's long reserve is drawn long.
      expect(text.track.outer.max).toBeGreaterThan(rirTrack(3).outer.max);
    }
  });
});

describe('deloadExplanation', () => {
  test('a strength exercise keeps the RIR plate of the deload week', () => {
    expect(deloadExplanation({ targetRir: 8 })).toEqual(
      rirExplanation({ targetRir: 8, isDeload: true, variant: 'reminder' }),
    );
    expect(deloadExplanation({ type: 'strength' }).track).toBeDefined();
  });

  test('a power exercise has no RIR to draw, and says what changes by its load', () => {
    const rows = (powerLoad?: 'weight' | 'level' | 'none') =>
      deloadExplanation({
        type: 'power',
        ...(powerLoad === undefined ? {} : { powerLoad }),
      }).rows.map((row) => readRow(row.text).said);

    expect(deloadExplanation({ type: 'power' }).track).toBeUndefined();
    expect(rows('weight')[1]).toBe('About half your usual load, two sets at most.');
    expect(rows()[1]).toBe('About half your usual load, two sets at most.');
    expect(rows('level')[1]).toBe('Same level, two sets at most.');
    expect(rows('none')[1]).toBe('Same body weight, two sets at most.');
  });
});
