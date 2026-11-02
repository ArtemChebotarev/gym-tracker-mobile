import { powerTargetPlate } from '@components/PowerTargetPlateLogic';

// 08.11, "Power: Load ⓘ" — the plate once the set has a target.
describe('powerTargetPlate', () => {
  const row = { targetReps: 4, suggestedWeight: 20 };

  test('no target, no plate: the ⓘ opens how to find the load instead', () => {
    expect(powerTargetPlate({}, 'weight')).toBeUndefined();
    expect(powerTargetPlate(undefined, 'weight')).toBeUndefined();
  });

  test('kilograms: the target, what a heavier load means, and the two rules', () => {
    expect(powerTargetPlate(row, 'weight')).toMatchObject({
      title: 'Current set target: 20 kg × 4',
      subtitle: 'Heavier means fewer fast reps. Stay in the range.',
      marker: 4,
      rows: [
        ['Stop when ', { strong: 'the speed drops' }, '. Count only the fast reps.'],
        ['Next time: ', { strong: '+1 rep' }, ' on each set.'],
      ],
    });
  });

  test('a level reads as a level, and goes higher rather than heavier', () => {
    expect(powerTargetPlate({ targetReps: 4, suggestedWeight: 2 }, 'level')).toMatchObject({
      title: 'Current set target: Level 2 × 4',
      subtitle: 'Higher means fewer fast reps. Stay in the range.',
    });
  });

  test('no load is only the reps, with nothing to go heavier on', () => {
    const plate = powerTargetPlate({ targetReps: 4 }, 'none');

    expect(plate?.title).toBe('Current set target: 4 reps');
    expect(plate).not.toHaveProperty('subtitle');
  });

  test('an estimate is titled as one', () => {
    expect(powerTargetPlate({ ...row, estimate: 'other_slot' }, 'weight')?.title).toBe(
      'Current set estimate: 20 kg × 4',
    );
  });

  test('draws the power corridor, 2 to 6, with the target labelled on it', () => {
    const corridor = powerTargetPlate(row, 'weight')?.corridor;

    expect(corridor?.inner).toEqual({ min: 2, max: 6 });
    expect(corridor?.labels.map((label) => label.text)).toEqual(['2', '4', '6 fast reps']);
    expect(corridor?.accessibilityLabel).toBe('Fast reps per set: 2 to 6, target 4');
  });

  test('a target on a bound is not labelled twice', () => {
    const labels = (targetReps: number) =>
      powerTargetPlate({ targetReps }, 'none')?.corridor.labels.map((label) => label.text);

    expect(labels(2)).toEqual(['2', '6 fast reps']);
    expect(labels(6)).toEqual(['2', '6 fast reps']);
  });

  test('a target past the corridor stretches the scale rather than leave it', () => {
    const corridor = powerTargetPlate({ targetReps: 9 }, 'none')?.corridor;

    expect(corridor?.outer).toEqual({ min: 0, max: 10 });
    expect(corridor?.labels.map((label) => label.text)).toEqual(['2', '6 fast reps', '9']);
  });
});
