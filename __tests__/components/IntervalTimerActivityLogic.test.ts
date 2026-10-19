import {
  intervalActivityLook,
  intervalActivityProps,
} from '@components/IntervalTimerActivityLogic';
import { COLORS } from '@design/tokens';

const PHASE = {
  phase: 'Work',
  round: 'Round 2 of 3',
  phaseStartedAt: 1_000,
  phaseEndsAt: 21_000,
  canSkipRest: false,
};

describe('intervalActivityProps', () => {
  it('running: a live timer between the phase start and end, no paused text', () => {
    const props = intervalActivityProps(PHASE);
    expect(props).toMatchObject(PHASE);
    expect(props.pausedLabel).toBeUndefined();
  });

  it('paused: what is left as plain text, rounded up as the live timer shows it', () => {
    expect(intervalActivityProps({ ...PHASE, pausedRemainingMs: 12_300 }).pausedLabel).toBe('0:13');
    expect(intervalActivityProps({ ...PHASE, pausedRemainingMs: 13_000 }).pausedLabel).toBe('0:13');
    expect(intervalActivityProps({ ...PHASE, pausedRemainingMs: 75_000 }).pausedLabel).toBe('1:15');
    expect(intervalActivityProps({ ...PHASE, pausedRemainingMs: 0 }).pausedLabel).toBe('0:00');
  });

  it('carries its look from the design tokens: brand orange for the running time only', () => {
    expect(intervalActivityProps(PHASE).look).toEqual(intervalActivityLook());
    expect(intervalActivityLook().clockColor).toBe(COLORS['brand/orange']);
  });
});
