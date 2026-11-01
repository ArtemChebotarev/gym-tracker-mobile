import { DELOAD_INTRO_FACTS } from '@components/DeloadIntroDialogLogic';

const said = DELOAD_INTRO_FACTS.map((fact) => `${fact.chip} ${fact.text}`).join(' ');

describe('DELOAD_INTRO_FACTS', () => {
  test('one text speaks of every type: weight, reps, work time, sets and rounds', () => {
    expect(said).toMatch(/weight/i);
    expect(said).toMatch(/reps/i);
    expect(said).toMatch(/work/i);
    expect(said).toMatch(/sets/i);
    expect(said).toMatch(/rounds/i);
  });

  test('it mentions neither RIR nor a reserve, and never says half', () => {
    expect(said).not.toMatch(/RIR|reps left|half/i);
  });
});
