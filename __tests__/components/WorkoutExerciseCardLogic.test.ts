import {
  type WeightEdits,
  carryWeightForward,
  cardInfoTargets,
  editWeightText,
  exerciseCardView,
  firstUnloggedRow,
  formatWeightHint,
  holdLoggedWeight,
  showsGroupChip,
  weightFieldText,
  estimateNote,
  weightSwapPopover,
} from '@components/WorkoutExerciseCardLogic';
import { defaultProgressionSettings } from '@domain/mesocycle';
import { buildWeightSwap } from '@domain/weightSwapRules';
import type { WorkoutSetRow } from '@usecases/workoutSession';

const ROW: WorkoutSetRow = { setNumber: 1, isFirstUnlogged: false, log: { weight: 60, reps: 10 } };
const SKIPPED_ROW: WorkoutSetRow = { setNumber: 2, isFirstUnlogged: false, notDone: 'skipped' };

describe('exerciseCardView', () => {
  test('live: the menu and the RIR badge, set rows, no plate', () => {
    expect(exerciseCardView('live', { status: 'planned', targetRir: 2, rows: [ROW] })).toEqual({
      showMenu: true,
      rirLabel: '2 RIR',
      isNotDone: false,
      showSets: true,
      notDoneNote: undefined,
      showNotProgrammed: false,
    });
  });

  test('read-only: no menu, everything else like live', () => {
    expect(
      exerciseCardView('readonly', { status: 'completed', targetRir: 2, rows: [ROW] }),
    ).toEqual({
      showMenu: false,
      rirLabel: '2 RIR',
      isNotDone: false,
      showSets: true,
      notDoneNote: undefined,
      showNotProgrammed: false,
    });
  });

  test('a skipped exercise with sets logged is dimmed but keeps its rows, menu in live only', () => {
    expect(
      exerciseCardView('live', { status: 'skipped', targetRir: 2, rows: [ROW, SKIPPED_ROW] }),
    ).toMatchObject({
      showMenu: true,
      isNotDone: true,
      showSets: true,
    });
    expect(
      exerciseCardView('readonly', { status: 'skipped', targetRir: 2, rows: [ROW, SKIPPED_ROW] }),
    ).toMatchObject({
      showMenu: false,
      isNotDone: true,
      showSets: true,
    });
  });

  test('a skipped exercise with nothing logged collapses its rows into one Skipped note', () => {
    expect(
      exerciseCardView('readonly', {
        status: 'skipped',
        targetRir: 2,
        rows: [{ ...SKIPPED_ROW, setNumber: 1 }, SKIPPED_ROW],
      }),
    ).toMatchObject({ isNotDone: true, showSets: false, notDoneNote: 'Skipped' });
  });

  test('an abandoned exercise reads the same, under its own word (136)', () => {
    const abandonedRow: WorkoutSetRow = { ...SKIPPED_ROW, notDone: 'abandoned' };
    expect(
      exerciseCardView('history', {
        status: 'abandoned',
        targetRir: 2,
        rows: [{ ...abandonedRow, setNumber: 1 }, abandonedRow],
      }),
    ).toMatchObject({ isNotDone: true, showSets: false, notDoneNote: 'Abandoned' });
    expect(
      exerciseCardView('history', { status: 'abandoned', targetRir: 2, rows: [ROW, abandonedRow] }),
    ).toMatchObject({ isNotDone: true, showSets: true, notDoneNote: undefined });
  });

  test('preview: the plate only — no menu, no RIR badge, no set rows', () => {
    expect(exerciseCardView('preview', { status: 'planned', targetRir: 2, rows: [ROW] })).toEqual({
      showMenu: false,
      rirLabel: undefined,
      isNotDone: false,
      showSets: false,
      notDoneNote: undefined,
      showNotProgrammed: true,
    });
  });

  test('no RIR badge without a target RIR', () => {
    expect(exerciseCardView('live', { status: 'planned', rows: [ROW] }).rirLabel).toBeUndefined();
  });
});

describe('showsGroupChip', () => {
  const exercises = [
    { muscleGroup: 'chest' },
    { muscleGroup: 'chest' },
    { muscleGroup: 'back' },
    { muscleGroup: 'chest' },
  ] as const;

  test('the first card always gets the chip', () => {
    expect(showsGroupChip(exercises, 0)).toBe(true);
  });

  test('no chip when the group is the same as the previous card', () => {
    expect(showsGroupChip(exercises, 1)).toBe(false);
  });

  test('a chip when the group changes from the previous card', () => {
    expect(showsGroupChip(exercises, 2)).toBe(true);
  });

  test('a group coming back after another one gets the chip again', () => {
    expect(showsGroupChip(exercises, 3)).toBe(true);
  });

  test('groups sharing a color family still count as different (traps after back)', () => {
    expect(showsGroupChip([{ muscleGroup: 'back' }, { muscleGroup: 'traps' }], 1)).toBe(true);
  });

  test('an index past the list gets no chip', () => {
    expect(showsGroupChip(exercises, 4)).toBe(false);
  });
});

describe('formatWeightHint', () => {
  test('go heavier names the upper bound reached', () => {
    expect(formatWeightHint({ direction: 'increase', reps: 30 })).toBe(
      'Go heavier — 30+ reps last week',
    );
  });

  test('go lighter names the lower bound missed', () => {
    expect(formatWeightHint({ direction: 'decrease', reps: 5 })).toBe(
      'Go lighter — under 5 reps last week',
    );
  });
});

describe('the Weight fields of one exercise (task 106)', () => {
  /** Three sets suggested at 60 kg, none logged — the shape the carry-over rules are written for. */
  function sets(...overrides: Partial<WorkoutSetRow>[]): WorkoutSetRow[] {
    return [1, 2, 3].map((setNumber) => ({
      setNumber,
      suggestedWeight: 60,
      isFirstUnlogged: setNumber === 1,
      ...overrides[setNumber - 1],
    }));
  }

  /** What each set's field shows, as the card reads it out. */
  function texts(edits: WeightEdits, rows: WorkoutSetRow[]): string[] {
    return rows.map((row) => weightFieldText(edits, row));
  }

  describe('weightFieldText', () => {
    test('an untouched field shows the set\'s suggested weight', () => {
      expect(weightFieldText({}, { setNumber: 1, suggestedWeight: 62.5 })).toBe('62.5');
    });

    test('empty when the set has no suggested weight', () => {
      expect(weightFieldText({}, { setNumber: 1 })).toBe('');
    });

    test('an edit wins over the suggested weight — including an emptied field', () => {
      const edits = editWeightText({}, 1, '');
      expect(weightFieldText(edits, { setNumber: 1, suggestedWeight: 62.5 })).toBe('');
    });
  });

  describe('carryWeightForward', () => {
    test("DoD: the first set's weight fills the whole exercise", () => {
      const rows = sets();
      const edits = carryWeightForward(editWeightText({}, 1, '20'), rows, 1);

      expect(texts(edits, rows)).toEqual(['20', '20', '20']);
    });

    test('DoD: a logged set is never touched, and only later sets follow', () => {
      // Artem's example: set 1 logged at 20, set 2 corrected to 25 — set 3 follows, set 1 doesn't.
      const rows = sets({ log: { weight: 20, reps: 10 } });
      const edits = carryWeightForward(editWeightText({}, 2, '25'), rows, 2);

      expect(texts(edits, rows)).toEqual(['60', '25', '25']);
      expect(rows[0]?.log).toEqual({ weight: 20, reps: 10 });
    });

    test('DoD: a field the user typed in themselves is left alone', () => {
      const rows = sets();
      let edits = carryWeightForward(editWeightText({}, 3, '30'), rows, 3);
      edits = carryWeightForward(editWeightText(edits, 1, '20'), rows, 1);

      expect(texts(edits, rows)).toEqual(['20', '20', '30']);
    });

    test('a carried value is not the user\'s own — a later edit replaces it', () => {
      const rows = sets();
      let edits = carryWeightForward(editWeightText({}, 1, '20'), rows, 1);
      edits = carryWeightForward(editWeightText(edits, 2, '25'), rows, 2);

      expect(texts(edits, rows)).toEqual(['20', '25', '25']);
    });

    test('leaving a field nobody typed in carries nothing', () => {
      const rows = sets({}, { suggestedWeight: undefined });

      expect(carryWeightForward({}, rows, 1)).toEqual({});
    });

    test('the last set has nothing to carry into', () => {
      const rows = sets();
      const typed = editWeightText({}, 3, '30');

      expect(carryWeightForward(typed, rows, 3)).toEqual(typed);
    });

    test('a set number that is not in the rows changes nothing', () => {
      const typed = editWeightText({}, 9, '30');

      expect(carryWeightForward(typed, sets(), 9)).toEqual(typed);
    });

    test('an emptied field carries the empty value forward too', () => {
      const rows = sets();
      const edits = carryWeightForward(editWeightText({}, 1, ''), rows, 1);

      expect(texts(edits, rows)).toEqual(['', '', '']);
    });
  });

  describe('holdLoggedWeight', () => {
    test("un-logging puts the logged weight back, as the user's own value", () => {
      const rows = sets();
      let edits = carryWeightForward(editWeightText({}, 1, '20'), rows, 1);
      edits = holdLoggedWeight(edits, 2, 25);
      edits = carryWeightForward(editWeightText(edits, 1, '22'), rows, 1);

      expect(texts(edits, rows)).toEqual(['22', '25', '22']);
    });
  });
});

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

  describe('firstUnloggedRow', () => {
    test('the set whose Log box carries the accent', () => {
      const rows = [
        { setNumber: 1, isFirstUnlogged: false },
        { setNumber: 2, isFirstUnlogged: true },
      ] as WorkoutSetRow[];

      expect(firstUnloggedRow(rows)?.setNumber).toBe(2);
    });

    test('nothing once every set is logged', () => {
      expect(firstUnloggedRow([{ setNumber: 1, isFirstUnlogged: false }] as WorkoutSetRow[])).toBeUndefined();
    });
  });

  describe('cardInfoTargets', () => {
    const base = {
      status: 'planned' as const,
      targetRir: 3,
      equipment: 'barbell' as const,
      rows: [{ setNumber: 1, isFirstUnlogged: true }] as WorkoutSetRow[],
    };

    test('a live card has the RIR badge and the Weight ⓘ; the Reps ⓘ needs a weight swap', () => {
      expect(cardInfoTargets(base, 'live', false)).toEqual({ rir: true, weight: true, reps: false });
    });

    test('a weight swap on the next set adds the Reps ⓘ', () => {
      const withSwap = {
        ...base,
        rows: [{ setNumber: 1, isFirstUnlogged: true, weightSwap: { unavailable: 'no_history' } }] as WorkoutSetRow[],
      };

      expect(cardInfoTargets(withSwap, 'live', false).reps).toBe(true);
    });

    test('a deload card keeps only the badge', () => {
      expect(cardInfoTargets(base, 'live', true)).toEqual({ rir: true, weight: false, reps: false });
    });

    test('a read-only card has the badge and no ⓘ at all', () => {
      expect(cardInfoTargets(base, 'readonly', false)).toEqual({
        rir: true,
        weight: false,
        reps: false,
      });
    });

    test('a card with no RIR has no badge', () => {
      expect(cardInfoTargets({ ...base, targetRir: undefined }, 'live', false).rir).toBe(false);
    });
  });

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
          markers: [5, 30],
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
