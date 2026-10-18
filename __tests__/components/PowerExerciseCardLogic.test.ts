import {
  formatCeilingNote,
  powerLoadColumnLabel,
  topWeightOf,
} from '@components/PowerExerciseCardLogic';

// GT-82, 10.1 FR-2: the Load column says what a power exercise's load is.
describe('powerLoadColumnLabel', () => {
  test('kilograms, a level, or the body', () => {
    expect(powerLoadColumnLabel('weight')).toBe('Load, kg');
    expect(powerLoadColumnLabel('level')).toBe('Level');
    expect(powerLoadColumnLabel('none')).toBe('Bodyweight, kg');
  });
});

// GT-81, 10.2 P6–P9: the note at the top of a power card's corridor — the mockup's shape.
describe('formatCeilingNote', () => {
  const didReps =
    "You did 6+ fast reps on every set last week. That's the top of the recommended range.";

  test('kilograms: try heavier or add a set, what the user did, and the flag as a link', () => {
    expect(
      formatCeilingNote(
        { options: ['heavier', 'add-set'], canFlagNoHeavier: true, canHideTip: false },
        { load: 'weight', topWeight: 10 },
      ),
    ).toEqual({
      icon: 'up',
      lead: 'Try heavier or add a set.',
      text: didReps,
      flagLabel: 'No heavier available',
    });
  });

  test('a level says so, in the step and in the flag', () => {
    expect(
      formatCeilingNote(
        { options: ['higher-level'], canFlagNoHeavier: true, canHideTip: false },
        { load: 'level' },
      ),
    ).toEqual({
      icon: 'up',
      lead: 'Try a higher level.',
      text: didReps,
      flagLabel: 'No higher level available',
    });
  });

  test('its own load: only a set, with a plus and no flag', () => {
    expect(
      formatCeilingNote(
        { options: ['add-set'], canFlagNoHeavier: false, canHideTip: false },
        { load: 'none' },
      ),
    ).toEqual({ icon: 'plus', lead: 'Add a set.', text: didReps });
  });

  test('once nothing heavier is left: a harder variation, why, and Replace exercise', () => {
    expect(
      formatCeilingNote(
        { options: ['harder-variation', 'add-set'], canFlagNoHeavier: false, canHideTip: true },
        { load: 'weight', topWeight: 10 },
      ),
    ).toEqual({
      icon: 'swap',
      lead: 'Try a harder variation or add a set.',
      text: '10 kg is the heaviest you have. Or keep it here while your strength catches up.',
      replaceLabel: 'Replace exercise',
      hideLabel: 'Hide this tip',
    });
    expect(
      formatCeilingNote(
        { options: ['harder-variation'], canFlagNoHeavier: false, canHideTip: true },
        { load: 'level' },
      ).text,
    ).toBe('This is the highest level you have. Or keep it here while your strength catches up.');
  });
});

describe('topWeightOf', () => {
  test('the heaviest weight of the rows, or nothing when none has one', () => {
    expect(topWeightOf([{ suggestedWeight: 8 }, { suggestedWeight: 10 }, {}])).toEqual({
      topWeight: 10,
    });
    expect(topWeightOf([{}, {}])).toEqual({});
  });
});
