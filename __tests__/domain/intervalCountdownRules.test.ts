import { countdownStart } from '@domain/intervalCountdownRules';

const END = 100_000;

describe('countdownStart', () => {
  it('waits until 3 s before the phase ends, then plays the clip from the start', () => {
    expect(countdownStart(END, END - 20_000)).toEqual({ delayMs: 17_000, offsetSec: 0 });
  });

  it('starts at once from the start with exactly 3 s left', () => {
    expect(countdownStart(END, END - 3_000)).toEqual({ delayMs: 0, offsetSec: 0 });
  });

  it('starts part way in with less than 3 s left, so the signal still lands on the end', () => {
    // A Get ready of 2 s, or a resume with 2 s to go: the "2" tick, the "1" tick, the signal.
    expect(countdownStart(END, END - 2_000)).toEqual({ delayMs: 0, offsetSec: 1 });
    expect(countdownStart(END, END - 500)).toEqual({ delayMs: 0, offsetSec: 2.5 });
  });

  it('plays only the signal when the phase ends right now — a Get ready of 0', () => {
    expect(countdownStart(END, END)).toEqual({ delayMs: 0, offsetSec: 3 });
  });

  it('plays nothing for a phase that is already over', () => {
    expect(countdownStart(END, END + 1)).toBeNull();
  });
});
