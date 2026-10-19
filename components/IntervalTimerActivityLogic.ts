import { formatClock } from '@design/formatClock';
import { COLORS, SPACING, TYPOGRAPHY } from '@design/tokens';

// What the interval timer's Live Activity (10.1 FR-6; canvas 2.x) is drawn from — see
// IntervalTimerActivity.tsx for why its layout takes everything, colours and sizes included, as
// props. The approach was settled in the GT-94 spike and checked on the phone; the layout itself is
// GT-99's.

/** The colours and sizes of the Live Activity, resolved from the design tokens in the app. */
export type IntervalActivityLook = {
  /** The running time (FR-6: brand orange is for running time only). */
  clockColor: string;
  /** The running time on an always-on screen, where the system dims the activity. */
  clockColorDimmed: string;
  clockSize: number;
  clockSizeExpanded: number;
  clockSizeCompact: number;
  clockSizeMinimal: number;
  titleSize: number;
  captionSize: number;
  padding: number;
};

/** A button on the Live Activity — its `target`, which comes back to the app when it is tapped. */
export type IntervalActivityAction = 'pause' | 'skipRest';

export type IntervalTimerActivityProps = {
  look: IntervalActivityLook;
  /** The phase, as the timer screen names it: Get ready, Work, Rest. */
  phase: string;
  /** Where in the block it is: `Round 2 of 3`. */
  round: string;
  /** The running phase, epoch ms: the activity counts down between the two by itself. */
  phaseStartedAt: number;
  phaseEndsAt: number;
  /**
   * Set while paused: what is left, as plain text (`0:13`). A paused timer is drawn as text, not as
   * a live timer given a pause time — on the phone that one went on counting for 4–9 s after the
   * pause, its button already reading Resume (GT-94, 19.10.2026).
   */
  pausedLabel?: string;
  /** Skip rest is offered during a rest only (FR-6: on the lock screen Pause, and Skip rest in a rest). */
  canSkipRest: boolean;
};

export function intervalActivityLook(): IntervalActivityLook {
  return {
    clockColor: COLORS['brand/orange'],
    clockColorDimmed: COLORS['text/primary'],
    clockSize: TYPOGRAPHY['type/entity-title'].fontSize,
    clockSizeExpanded: TYPOGRAPHY['type/value'].fontSize,
    clockSizeCompact: TYPOGRAPHY['type/footnote'].fontSize,
    clockSizeMinimal: TYPOGRAPHY['type/caption'].fontSize,
    titleSize: TYPOGRAPHY['type/card-title'].fontSize,
    captionSize: TYPOGRAPHY['type/footnote'].fontSize,
    padding: SPACING['space/md'],
  };
}

const MS_PER_SEC = 1000;

/**
 * The Live Activity's props for a phase: running from `phaseStartedAt` to `phaseEndsAt`, or paused
 * with `pausedRemainingMs` left — shown rounded up, as the live timer shows it.
 */
export function intervalActivityProps(phase: {
  phase: string;
  round: string;
  phaseStartedAt: number;
  phaseEndsAt: number;
  pausedRemainingMs?: number;
  canSkipRest: boolean;
}): IntervalTimerActivityProps {
  const { pausedRemainingMs, ...rest } = phase;
  return {
    ...rest,
    look: intervalActivityLook(),
    pausedLabel:
      pausedRemainingMs === undefined
        ? undefined
        : formatClock(Math.max(0, Math.ceil(pausedRemainingMs / MS_PER_SEC))),
  };
}
