import { firstWeightLead } from '@components/FirstWeightPopoverLogic';

describe('firstWeightLead', () => {
  test('stops at the exercise’s own RIR', () => {
    expect(firstWeightLead(3)).toBe('Then do a working set and stop at 3 RIR.');
    expect(firstWeightLead(1)).toBe('Then do a working set and stop at 1 RIR.');
  });

  test('at 0 RIR it says failure rather than "stop at 0 RIR", which reads as a typo', () => {
    expect(firstWeightLead(0)).toBe('Then do a working set and go to failure.');
  });

  test('without a recorded RIR it still says how hard to go, without a number', () => {
    expect(firstWeightLead(undefined)).toBe(
      'Then do a working set and stop a few reps short of failure.',
    );
  });
});
