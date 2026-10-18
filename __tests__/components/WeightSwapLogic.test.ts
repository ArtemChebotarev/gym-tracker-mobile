import { estimateNote, weightSwapPopover } from '@components/WeightSwapLogic';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { buildWeightSwap } from '@domain/weightSwapRules';

// The ⓘ popover and the card's InlineNote — 08.7.1 · Другой вес (task 121). The numbers come from
// the swap the workout data already carries (task 120); these are about the words around them.
describe('the weight swap popover and note', () => {
  const settings = defaultProgressionSettings;

  function rowWith(targetReps: number, suggestedWeight: number, setNumber = 1) {
    return {
      setNumber,
      weightSwap: buildWeightSwap({
        target: { targetReps, suggestedWeight },
        settings,
        isDeload: false,
        equipment: 'dumbbell' as const,
      }),
    };
  }

  const dipRow = {
    setNumber: 1,
    weightSwap: buildWeightSwap({
      target: { targetReps: 7, suggestedWeight: 16 },
      settings,
      isDeload: false,
      equipment: 'bodyweight-weighted' as const,
      bodyWeight: 83,
    }),
  };

  describe('weightSwapPopover', () => {
    test('an estimate is titled as one (task 134.1)', () => {
      const popover = weightSwapPopover({ ...rowWith(15, 4.5), estimate: 'other_slot' }, 2);
      expect(popover?.title).toBe('Current set estimate: 4.5 kg × 15');
    });

    test('the ranges of the set, from its own target and never from what is typed', () => {
      const popover = weightSwapPopover(rowWith(10, 15), 2);

      expect(popover).toMatchObject({
        kind: 'ranges',
        title: 'Current set target: 15 kg × 10',
        subtitle: 'Pick another weight and the reps update.',
        outer: { min: 4, max: 17.5 },
        inner: { min: 12, max: 17.5 },
        marker: 15,
      });
    });

    test('the track is labelled at every bound it has, each value once', () => {
      expect(weightSwapPopover(rowWith(10, 15), 2)).toMatchObject({
        labels: [
          { value: 4, text: '4' },
          { value: 12, text: '12' },
          { value: 15, text: '15' },
          { value: 17.5, text: '17.5' },
        ],
      });
    });

    test('the legend names the close span, and what is left of the full one', () => {
      expect(weightSwapPopover(rowWith(10, 15), 2)).toMatchObject({
        legend: [
          { span: 'inner', label: 'Recommended weight', value: '12–17.5 kg' },
          { span: 'outer', label: 'Not ideal, but acceptable', value: '4–12 kg' },
        ],
      });
    });

    test('a close span that reaches both ends leaves no estimate line to write', () => {
      // A dip's close span runs the whole corridor: the body weight is most of the load, so ±20%
      // of it covers every added weight there is.
      expect(weightSwapPopover(dipRow, 2)).toMatchObject({
        title: 'Current set target: +16 kg × 7',
        legend: [{ span: 'inner', label: 'Recommended weight', value: '+0 to +22.5 kg' }],
      });
    });

    test('a close span narrower on both sides names both leftovers', () => {
      // 5 kg × 25: ±20% is 4–6 kg, while the rep corridor reaches from 3 to 13.
      expect(weightSwapPopover(rowWith(25, 5), 2)).toMatchObject({
        legend: [
          { span: 'inner', value: '4–6 kg' },
          { span: 'outer', value: '3–4 and 6–13 kg' },
        ],
      });
    });

    test('with no history it says so instead of showing numbers', () => {
      expect(
        weightSwapPopover({ setNumber: 1, weightSwap: { unavailable: 'no_history' } }, 3),
      ).toEqual({
        kind: 'no-history',
        title: 'Not enough history yet',
        // The 5–30 corridor as the Reps plate draws every span: dashes, the accent bar over the
        // part to aim for, the two ends named.
        corridor: {
          outer: { min: 0, max: 35 },
          inner: { min: 5, max: 30 },
          labels: [
            { value: 5, text: '5' },
            { value: 30, text: '30' },
          ],
          accessibilityLabel: 'Reps per set: 5 to 30',
        },
        steps: [
          ['Pick a weight you can lift for ', { strong: '5–30 reps' }, '.'],
          ['Stop each set with ', { strong: 'about 3 reps in reserve' }, '.'],
          ['Log this workout.'],
          ['Next time: ', { strong: 'reps will be calculated' }, ' for you.'],
        ],
      });
    });

    test('with no history at 1 RIR it says "1 rep", not "1 reps"', () => {
      const popover = weightSwapPopover(
        { setNumber: 1, weightSwap: { unavailable: 'no_history' } },
        1,
      );

      expect(popover).toMatchObject({
        steps: expect.arrayContaining([
          ['Stop each set with ', { strong: 'about 1 rep in reserve' }, '.'],
        ]),
      });
    });

    test('with no history at the last week’s 0 RIR it says failure, not "about 0 reps in reserve"', () => {
      const popover = weightSwapPopover(
        { setNumber: 1, weightSwap: { unavailable: 'no_history' } },
        0,
      );

      expect(popover).toMatchObject({ kind: 'no-history' });
      expect(popover?.kind === 'no-history' && popover.steps[1]).toEqual([
        'Take each set ',
        { strong: 'to failure' },
        '.',
      ]);
    });

    test('with no history and no recorded RIR it says how hard without a number', () => {
      const popover = weightSwapPopover(
        { setNumber: 1, weightSwap: { unavailable: 'no_history' } },
        undefined,
      );

      expect(popover?.kind === 'no-history' && popover.steps[1]).toEqual([
        'Stop each set with ',
        { strong: 'a few reps in reserve' },
        '.',
      ]);
    });

    test('no swap, no popover — a deload set or a pure bodyweight one', () => {
      expect(weightSwapPopover({ setNumber: 1 }, 2)).toBeUndefined();
      expect(weightSwapPopover(undefined, 2)).toBeUndefined();
    });
  });

  describe('estimateNote', () => {
    test('a weight that still hits the target needs no note', () => {
      expect(estimateNote(rowWith(10, 15), '15', 2)).toBeUndefined();
      expect(estimateNote(rowWith(10, 15), '14', 2)).toBeUndefined();
    });

    test('an estimate says where the number came from and what to go by instead', () => {
      expect(estimateNote(rowWith(10, 15), '10', 2)).toEqual({
        lead: '~ Estimated from 15 kg × 10.',
        text: 'Stop at 2 RIR, not at the number.',
      });
    });

    test('too heavy says how far the target still reaches', () => {
      expect(estimateNote(rowWith(10, 15), '20', 2)).toEqual({
        lead: '20 kg is too heavy for 5+ reps.',
        text: 'Up to 17.5 kg keeps a rep target.',
      });
    });

    test('too light says where it starts again', () => {
      expect(estimateNote(rowWith(10, 15), '2', 2)).toEqual({
        lead: '2 kg is too light for 30 reps.',
        text: 'From 4 kg keeps a rep target.',
      });
    });

    test('on a weighted bodyweight set the weights read as added ones', () => {
      expect(estimateNote(dipRow, '30', 2)).toEqual({
        lead: '+30 kg is too heavy for 5+ reps.',
        text: 'Up to +22.5 kg keeps a rep target.',
      });
    });

    // Task 134.1: the second reason — numbers from another day or block.
    test('an estimate from another slot says so, with nothing typed', () => {
      const row = { ...rowWith(15, 4.5), estimate: 'other_slot' as const };
      expect(estimateNote(row, '4.5', 2)).toEqual({
        lead: 'Approximate estimation based on your previous activity.',
        text: 'Stop at 2 RIR.',
      });
    });

    test('an estimate from another slot on a pure bodyweight set, with no swap at all', () => {
      expect(estimateNote({ estimate: 'other_slot' }, '80', undefined)).toEqual({
        lead: 'Approximate estimation based on your previous activity.',
        text: 'Stop at the effort.',
      });
    });

    test('the weight in the field speaks first when it has moved the target away', () => {
      const row = { ...rowWith(10, 15), estimate: 'other_slot' as const };
      expect(estimateNote(row, '20', 2)?.lead).toBe('20 kg is too heavy for 5+ reps.');
    });

    test('nothing typed, no note — and none without a swap behind the set', () => {
      expect(estimateNote(rowWith(10, 15), '', 2)).toBeUndefined();
      expect(estimateNote({ weightSwap: { unavailable: 'no_history' } }, '10', 2)).toBeUndefined();
      expect(estimateNote(undefined, '10', 2)).toBeUndefined();
    });
  });
});

describe('the range track labels', () => {
  function labelsOf(targetReps: number, suggestedWeight: number) {
    const popover = weightSwapPopover(
      {
        setNumber: 1,
        weightSwap: buildWeightSwap({
          target: { targetReps, suggestedWeight },
          settings: defaultProgressionSettings,
          isDeload: false,
          equipment: 'dumbbell',
        }),
      },
      2,
    );
    return popover?.kind === 'ranges' ? popover.labels.map((label) => label.text) : undefined;
  }

  test('the bounds and the target, when they all have room', () => {
    expect(labelsOf(10, 15)).toEqual(['4', '12', '15', '17.5']);
  });

  test('the target label steps aside when it would run into a bound', () => {
    // 10 kg × 7 reaches only 2.5–10.5 kg, so the target sits half a kilo from the heavy end.
    expect(labelsOf(7, 10)).toEqual(['2.5', '8', '10.5']);
  });
});
