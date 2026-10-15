import { describeLever, leverMovesTime } from '@components/ExerciseProgressionFieldsLogic';

describe('leverMovesTime', () => {
  test('rest and work move a time, so they have a step', () => {
    expect(leverMovesTime('rest')).toBe(true);
    expect(leverMovesTime('workTime')).toBe(true);
  });

  test('rounds always step by one and none does not move', () => {
    expect(leverMovesTime('rounds')).toBe(false);
    expect(leverMovesTime('none')).toBe(false);
  });
});

describe('describeLever', () => {
  test('names the step for the time levers', () => {
    expect(describeLever('rest', 15)).toContain('15 s shorter');
    expect(describeLever('workTime', 5)).toContain('5 s longer');
  });

  test('says one round for rounds and no change for none', () => {
    expect(describeLever('rounds', 15)).toContain('one more round');
    expect(describeLever('none', 15)).toContain('stays the same');
  });
});
