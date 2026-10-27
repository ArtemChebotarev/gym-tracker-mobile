import {
  leverFromValue,
  PLAN_LEVER_OPTIONS,
  planSheetSubtitle,
  stepFromValue,
} from '@components/CyclePlanSheetLogic';

describe('CyclePlanSheetLogic', () => {
  test('offers the four levers of FR-8 under the sheet’s short names', () => {
    expect(PLAN_LEVER_OPTIONS.map((option) => option.label)).toEqual(['Less rest', 'More work', '+1 round', 'None']);
  });

  test('reads a lever and a step back from their segment values, and refuses others', () => {
    expect(leverFromValue('workTime')).toBe('workTime');
    expect(stepFromValue('10')).toBe(10);
    expect(() => leverFromValue('output')).toThrow();
    expect(() => stepFromValue('20')).toThrow();
  });

  test('says whose plan it is', () => {
    expect(planSheetSubtitle(2)).toBe('Plan for this training cycle · Day 2');
  });
});
