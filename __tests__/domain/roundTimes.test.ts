import { roundTimesOf } from '@domain/roundTimes';

const planned = { targetWorkSec: 120, targetRestSec: 45 };
const done = { workSec: 135, restSec: 30, restSkipped: false, completed: true };

describe('roundTimesOf', () => {
  test('a logged round hands on the times it was done with', () => {
    expect(roundTimesOf(planned, done)).toEqual({ targetWorkSec: 135, targetRestSec: 30 });
  });

  test('not logged: the planned times', () => {
    expect(roundTimesOf(planned)).toEqual(planned);
  });

  test('a round ended early keeps the planned work, a skipped rest the planned rest', () => {
    expect(roundTimesOf(planned, { ...done, completed: false })).toEqual({
      targetWorkSec: 120,
      targetRestSec: 30,
    });
    expect(roundTimesOf(planned, { ...done, restSkipped: true })).toEqual({
      targetWorkSec: 135,
      targetRestSec: 45,
    });
  });

  test('a logged rest where none was planned is handed on', () => {
    expect(roundTimesOf({ targetWorkSec: 120 }, done)).toEqual({
      targetWorkSec: 135,
      targetRestSec: 30,
    });
  });

  test('no times and nothing logged: none — the card falls back on the cycle’s plan', () => {
    expect(roundTimesOf({})).toEqual({});
    expect(roundTimesOf(undefined)).toEqual({});
  });
});
