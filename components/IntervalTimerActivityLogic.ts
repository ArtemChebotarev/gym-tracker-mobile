import { formatClock } from '@design/formatClock';
import { COLORS, ICON_SIZES, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import {
  intervalPhaseProgress,
  intervalPhaseRemainingMs,
  isIntervalTimerRunning,
} from '@domain/intervalTimerRules';
import type { IntervalTimer } from '@domain/intervalTimer';
import type { ActiveIntervalTimer } from '@state/intervalTimerStore';

// What the interval timer's Live Activity (10.1 FR-6; canvas 2.6, GT-99) is drawn from — see
// IntervalTimerActivity.tsx for why its layout takes everything, colours and sizes included, as
// props. The approach was settled in the GT-94 spike and checked on the phone.

/** The colours and sizes of the Live Activity, resolved from the design tokens in the app. */
export type IntervalActivityLook = {
  /** The time (canvas 2.6: white; the orange is the bar's — FR-6, running time only). */
  clockColor: string;
  /** The bar of the phase running down. */
  barColor: string;
  /** The bar on an always-on screen, where the system dims the activity. */
  barColorDimmed: string;
  /**
   * The activity's own background, over the system's Liquid Glass — on which the grey buttons were
   * hard to read (Artem on the phone, 20.10.2026; canvas 2.6).
   */
  backgroundColor: string;
  /** The buttons: their plate and their label. */
  buttonColor: string;
  buttonLabelColor: string;
  buttonHeight: number;
  buttonIconSize: number;
  /** The app's icon, left of the phase. */
  iconSize: number;
  iconRadius: number;
  /** The time's fixed width — see `size/activity-clock`. */
  clockWidth: number;
  clockSize: number;
  clockSizeExpanded: number;
  clockSizeCompact: number;
  clockSizeMinimal: number;
  titleSize: number;
  captionSize: number;
  padding: number;
  gap: number;
};

/** A button on the Live Activity — its `target`, which comes back to the app when it is tapped. */
export type IntervalActivityAction = 'pause' | 'skipRest';

export type IntervalTimerActivityProps = {
  look: IntervalActivityLook;
  /**
   * The phase in bold: `Get ready`, `Work`, `Rest` — paused too: only the button and the held time
   * tell a paused activity apart (Artem, 20.10.2026), so it doesn't jump between the two.
   */
  phase: string;
  /** The line under it: `Heavy bag · round 2 of 3`, `Next: round 3 · 2:00` (canvas 2.6). */
  detail: string;
  /** The running phase, epoch ms: the time and the bar run down between the two by themselves. */
  phaseStartedAt: number;
  phaseEndsAt: number;
  /**
   * Set while paused: what is left, as plain text (`0:13`). A paused timer is drawn as text, not as
   * a live timer given a pause time — on the phone that one went on counting for 4–9 s after the
   * pause, its button already reading Resume (GT-94, 19.10.2026).
   */
  pausedLabel?: string;
  /** Set while paused: the share of the phase left, for the bar held where it stopped. */
  pausedProgress?: number;
  /** Skip rest is offered during a rest only (FR-6: on the lock screen Pause, and Skip rest in a rest). */
  canSkipRest: boolean;
  /** The app's icon in the shared directory (state/liveActivityIcon.ts); none if it isn't there. */
  iconUri?: string;
};

export function intervalActivityLook(): IntervalActivityLook {
  return {
    clockColor: COLORS['text/primary'],
    barColor: COLORS['brand/orange'],
    barColorDimmed: COLORS['text/primary'],
    backgroundColor: COLORS['surface/card'],
    buttonColor: COLORS['surface/control-active'],
    buttonLabelColor: COLORS['text/primary'],
    buttonHeight: SIZES['size/tap-target'],
    buttonIconSize: ICON_SIZES['icon/small'],
    iconSize: SIZES['size/activity-icon'],
    iconRadius: RADII['radius/segment-inner'],
    clockWidth: SIZES['size/activity-clock'],
    clockSize: TYPOGRAPHY['type/activity-clock'].fontSize,
    clockSizeExpanded: TYPOGRAPHY['type/value'].fontSize,
    clockSizeCompact: TYPOGRAPHY['type/footnote'].fontSize,
    clockSizeMinimal: TYPOGRAPHY['type/caption'].fontSize,
    titleSize: TYPOGRAPHY['type/card-title'].fontSize,
    captionSize: TYPOGRAPHY['type/meta'].fontSize,
    padding: SPACING['space/md'],
    gap: SPACING['space/gap'],
  };
}

const MS_PER_SEC = 1000;

/**
 * The Live Activity's props for a phase: running from `phaseStartedAt` to `phaseEndsAt`, or paused
 * with `pausedRemainingMs` left — shown rounded up, as the live timer shows it.
 */
export function intervalActivityProps(phase: {
  phase: string;
  detail: string;
  phaseStartedAt: number;
  phaseEndsAt: number;
  pausedRemainingMs?: number;
  pausedProgress?: number;
  canSkipRest: boolean;
}): IntervalTimerActivityProps {
  const { pausedRemainingMs, pausedProgress, ...rest } = phase;
  const props: IntervalTimerActivityProps = { ...rest, look: intervalActivityLook() };
  if (pausedRemainingMs !== undefined) {
    props.pausedLabel = formatClock(Math.max(0, Math.ceil(pausedRemainingMs / MS_PER_SEC)));
    props.pausedProgress = pausedProgress ?? 0;
  }
  return props;
}

/**
 * The Live Activity of the timer `active` at `now` (canvas 2.6): `Work` over `Heavy bag · round 2
 * of 3`, `Rest` over `Next: round 3 · 2:00`, `Get ready` over the round it leads into; paused,
 * the same, with the time and bar held. `undefined` once the block is over — the activity ends.
 */
export function intervalActivityPropsOf(
  { exercise, timer }: ActiveIntervalTimer,
  now: number,
): IntervalTimerActivityProps | undefined {
  const phase = timer.phase;
  if (phase === undefined) return undefined;
  const round = timer.rounds[phase.round];
  const after = timer.rounds[phase.round + 1];
  const detail =
    phase.kind === 'rest'
      ? after === undefined
        ? exercise.name
        : `Next: round ${after.roundNumber} · ${formatClock(after.workSec)}`
      : `${exercise.name} · round ${round?.roundNumber} of ${exercise.totalRounds}`;
  const running = isIntervalTimerRunning(timer);
  const name = phase.kind === 'getReady' ? 'Get ready' : phase.kind === 'work' ? 'Work' : 'Rest';
  const endsAt = timer.endsAt ?? now + intervalPhaseRemainingMs(timer, now);
  return intervalActivityProps({
    phase: name,
    detail,
    phaseStartedAt: endsAt - timer.durationMs,
    phaseEndsAt: endsAt,
    ...(running
      ? {}
      : {
          pausedRemainingMs: intervalPhaseRemainingMs(timer, now),
          pausedProgress: intervalPhaseProgress(timer, now),
        }),
    canSkipRest: phase.kind === 'rest',
  });
}

/**
 * The timer's state as far as its Live Activity cares, as one value: it changes when a phase
 * starts, pauses or runs again — the moments the activity is updated. Between them the activity's
 * time and bar run by themselves. `undefined` once the block is over.
 */
export function activityStateKey(timer: IntervalTimer | undefined): string | undefined {
  const phase = timer?.phase;
  if (timer === undefined || phase === undefined) return undefined;
  const held = timer.endsAt === undefined ? `paused:${timer.remainingMs}` : `to:${timer.endsAt}`;
  return `${phase.kind}:${phase.round}:${held}`;
}
