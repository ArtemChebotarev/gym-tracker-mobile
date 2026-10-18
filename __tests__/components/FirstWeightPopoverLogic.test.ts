import { firstWeightCopy, workingSetText } from '@components/FirstWeightPopoverLogic';

const tail = ". If it felt right, that's your weight.";

describe('workingSetText', () => {
  test('stops at the exercise’s own RIR', () => {
    expect(workingSetText(3)).toEqual([
      'Do one set, ',
      { strong: 'stop at 3 RIR' },
      ' and ',
      { strong: 'log it' },
      tail,
    ]);
    expect(workingSetText(1)).toEqual([
      'Do one set, ',
      { strong: 'stop at 1 RIR' },
      ' and ',
      { strong: 'log it' },
      tail,
    ]);
  });

  test('at 0 RIR it says failure rather than "stop at 0 RIR", which reads as a typo', () => {
    expect(workingSetText(0)).toEqual([
      'Do one set, ',
      { strong: 'go to failure' },
      ' and ',
      { strong: 'log it' },
      tail,
    ]);
  });

  test('without a recorded RIR it still says how hard to go, without a number', () => {
    expect(workingSetText(undefined)).toEqual([
      'Do one set, ',
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

  test('power finds its load for speed: no RIR, no 12 / 8 / 4 ladder', () => {
    const copy = firstWeightCopy('power', 2);

    expect(copy.title).toBe('Finding your load');
    expect(copy.warmUpSteps).toHaveLength(2);
    expect(JSON.stringify(copy)).not.toMatch(/RIR|12 reps|failure/);
  });
});
