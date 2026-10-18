import {
  leverFromValue,
  PLAN_LEVER_OPTIONS,
  planSheetSubtitle,
  stepFromValue,
  timeFieldValue,
  withTimeField,
} from '@components/CyclePlanSheetLogic';
import { HEAVY_BAG_CONFIG } from '../fixtures/hybridExercises';

const bag = { ...HEAVY_BAG_CONFIG, rounds: 3 };

describe('CyclePlanSheetLogic', () => {
  test('offers the four levers of FR-8 under canvas 7.3’s short names', () => {
    expect(PLAN_LEVER_OPTIONS.map((option) => option.label)).toEqual(['Less rest', 'More work', '+1 round', 'Keep']);
  });

  test('reads a lever and a step back from their segment values, and refuses others', () => {
    expect(leverFromValue('workTime')).toBe('workTime');
    expect(stepFromValue('10')).toBe(10);
    expect(() => leverFromValue('output')).toThrow();
    expect(() => stepFromValue('20')).toThrow();
  });

  test('sets and reads a time field, leaving a type without it alone', () => {
    expect(withTimeField(bag, 'restSec', 30)).toEqual({ ...bag, restSec: 30 });
    expect(timeFieldValue(bag, 'workSec')).toBe(120);

    const mobility = { type: 'mobility' as const, durationSec: 600 };
    expect(withTimeField(mobility, 'restSec', 30)).toBe(mobility);
    expect(timeFieldValue(mobility, 'restSec')).toBe(0);
  });

  test('says whose plan it is', () => {
    expect(planSheetSubtitle(2)).toBe('Plan for this training cycle · Day 2');
  });
});
