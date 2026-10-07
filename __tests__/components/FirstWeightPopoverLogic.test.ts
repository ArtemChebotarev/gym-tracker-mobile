import { workingSetText } from '@components/FirstWeightPopoverLogic';

const tail = ". If it felt right, that's your weight.";

describe('workingSetText', () => {
  test('stops at the exercise’s own RIR', () => {
    expect(workingSetText(3)).toEqual(['Do one set, ', { strong: 'stop at 3 RIR' }, ' and ', { strong: 'log it' }, tail]);
    expect(workingSetText(1)).toEqual(['Do one set, ', { strong: 'stop at 1 RIR' }, ' and ', { strong: 'log it' }, tail]);
  });

  test('at 0 RIR it says failure rather than "stop at 0 RIR", which reads as a typo', () => {
    expect(workingSetText(0)).toEqual(['Do one set, ', { strong: 'go to failure' }, ' and ', { strong: 'log it' }, tail]);
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
