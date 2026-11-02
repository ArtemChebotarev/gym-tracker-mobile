import { firstWeightCopy, workingSetText } from '@components/FirstWeightPopoverLogic';

const tail = ". If it felt right, that's your weight.";

describe('workingSetText', () => {
  test('stops at the exercise’s own RIR', () => {
    expect(workingSetText(3)).toEqual([
      'Do one set of ',
      { strong: '5–30 reps' },
      ', ',
      { strong: 'stop at 3 RIR' },
      ' and ',
      { strong: 'log it' },
      tail,
    ]);
    expect(workingSetText(1)).toEqual([
      'Do one set of ',
      { strong: '5–30 reps' },
      ', ',
      { strong: 'stop at 1 RIR' },
      ' and ',
      { strong: 'log it' },
      tail,
    ]);
  });

  test('at 0 RIR it says failure rather than "stop at 0 RIR", which reads as a typo', () => {
    expect(workingSetText(0)).toEqual([
      'Do one set of ',
      { strong: '5–30 reps' },
      ', ',
      { strong: 'go to failure' },
      ' and ',
      { strong: 'log it' },
      tail,
    ]);
  });

  test('without a recorded RIR it still says how hard to go, without a number', () => {
    expect(workingSetText(undefined)).toEqual([
      'Do one set of ',
      { strong: '5–30 reps' },
      ', ',
      { strong: 'stop a few reps short of failure' },
      ' and ',
      { strong: 'log it' },
      tail,
    ]);
  });
});

describe('firstWeightCopy', () => {
  test("strength keeps the lifter's ladder and the stop at its RIR", () => {
    const copy = firstWeightCopy(undefined, 2);

    expect(copy.title).toBe('Finding your weight');
    expect(copy.warmUpSteps).toHaveLength(3);
    expect(copy.workingText).toEqual(workingSetText(2));
  });

  test('power finds its load for speed: no RIR, no ladder of any kind', () => {
    const copy = firstWeightCopy('power', 2);

    expect(copy.title).toBe('Finding your load');
    expect(copy.warmUpSteps).toEqual([['Warm up with ', { strong: 'a few easy, fast reps' }, '.']]);
    expect(copy.warmUpNote).toBe("Warm-up sets aren't logged here.");
    expect(JSON.stringify(copy)).not.toMatch(/RIR|12 reps|failure|light|heavier|lower/);
  });

  test.each([
    ['weight', 'Finding your load', " If every rep stayed fast, that's your load."],
    ['level', 'Finding your level', " If every rep stayed fast, that's your level."],
    ['none', 'Fast reps', ''],
  ] as const)('the working set of a %s load', (load, title, tail) => {
    const copy = firstWeightCopy('power', undefined, load);

    expect(copy.title).toBe(title);
    expect(copy.workingText).toEqual([
      'Do one set of ',
      { strong: '2–6 fast reps' },
      ', stop when ',
      { strong: 'the speed drops' },
      ' and ',
      { strong: 'log it' },
      `.${tail}`,
    ]);
  });

  test('every load warms up the same way', () => {
    const steps = firstWeightCopy('power', undefined, 'weight').warmUpSteps;

    expect(firstWeightCopy('power', undefined, 'level').warmUpSteps).toEqual(steps);
    expect(firstWeightCopy('power', undefined, 'none').warmUpSteps).toEqual(steps);
  });

  test('power by level first says the levels are the user’s own', () => {
    const copy = firstWeightCopy('power', undefined, 'level');

    expect(copy.intro).toMatch(/^Levels are your own/);
    expect(JSON.stringify(copy)).not.toMatch(/RIR|load|kg/);
  });
});
