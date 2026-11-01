import { deloadIntroCopy } from '@components/DeloadIntroDialogLogic';

const chips = (copy: ReturnType<typeof deloadIntroCopy>) => copy.facts.map((fact) => fact.chip);
const said = (copy: ReturnType<typeof deloadIntroCopy>) =>
  copy.facts.map((fact) => `${fact.chip} ${fact.text}`).join(' ');

describe('deloadIntroCopy', () => {
  test('a session of sets speaks of weight and reps, and has the note about them', () => {
    const copy = deloadIntroCopy([{ type: 'strength' }, {}]);

    expect(copy.facts).toEqual([
      { chip: '50% load', text: 'Less weight, or fewer reps with no weight to cut' },
      { chip: 'Fewer sets', text: 'Less work to recover from' },
      { chip: 'Easy sets', text: "Don't push: this week is for recovery" },
    ]);
    expect(copy.note).toBe('Reps shown are a guide based on last week.');
  });

  test('power is cut by weight or reps, so it reads as a session of sets', () => {
    expect(deloadIntroCopy([{ type: 'power' }])).toEqual(deloadIntroCopy([{ type: 'strength' }]));
  });

  test('sets and rounds together name both', () => {
    const copy = deloadIntroCopy([{ type: 'strength' }, { type: 'interval' }]);

    expect(chips(copy)).toEqual(['50% load', 'Fewer sets', 'Easy sets']);
    expect(said(copy)).toMatch(/shorter work/);
    expect(said(copy)).toMatch(/fewer rounds/);
    expect(copy.note).toBeDefined();
  });

  test('rounds alone say nothing of sets, weight or reps', () => {
    const copy = deloadIntroCopy([{ type: 'interval' }, { type: 'mobility' }]);

    expect(chips(copy)).toEqual(['50% load', 'Fewer rounds', 'Easy rounds']);
    expect(said(copy)).not.toMatch(/weight|reps|sets/i);
    expect(copy.note).toBeUndefined();
  });

  test.each([
    [[{ type: 'strength' }]],
    [[{ type: 'power' }]],
    [[{ type: 'interval' }]],
    [[{ type: 'strength' }, { type: 'interval' }]],
  ] as const)('no version mentions RIR or a reserve: %j', (exercises) => {
    expect(said(deloadIntroCopy(exercises))).not.toMatch(/RIR|reps left/);
  });
});
