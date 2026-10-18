import { fastRepsPlate } from '@components/FastRepsPlateLogic';

describe('fastRepsPlate', () => {
  test('says what a fast rep is and that 6 is a recommendation, not a stop', () => {
    const plate = fastRepsPlate();

    expect(plate.title).toBe('Fast reps');
    expect(plate.steps).toHaveLength(5);
    expect(plate.steps[0]).toEqual([
      'Pick a load you can move for ',
      { strong: '2–6 fast reps' },
      '.',
    ]);
    expect(plate.steps[3]).toEqual([
      'Recommended: ',
      { strong: 'up to 6 fast reps' },
      ' per set. Past that it trains endurance more than power.',
    ]);
  });

  test('draws the power corridor, 2 to 6, inside a longer scale', () => {
    const { corridor } = fastRepsPlate();

    expect(corridor.inner).toEqual({ min: 2, max: 6 });
    expect(corridor.outer.max).toBeGreaterThan(corridor.inner.max);
    expect(corridor.labels.map((label) => label.text)).toEqual(['2', '6']);
    expect(corridor.accessibilityLabel).toBe('Fast reps per set: 2 to 6');
  });
});
