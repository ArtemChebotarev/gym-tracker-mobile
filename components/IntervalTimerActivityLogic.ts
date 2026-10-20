import { formatClock } from '@design/formatClock';
import { COLORS, ICON_SIZES, RADII, SIZES, SPACING, TYPOGRAPHY } from '@design/tokens';
import {
  intervalPhaseProgress,
  intervalPhaseRemainingMs,
  intervalPhasesAhead,
  isIntervalTimerRunning,
  resumeIntervalTimer,
} from '@domain/intervalTimerRules';
import type { IntervalTimer, IntervalTimerPhase } from '@domain/intervalTimer';
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
  /** A rest's cell in the block's bar (a work's is `barColor`). */
  restBarColor: string;
  /** The gap between the cells of the block's bar. */
  segmentGap: number;
  /** The bar on an always-on screen, where the system dims the activity. */
  barColorDimmed: string;
  /** The bar's height, the same running and paused — see `size/activity-bar`. */
  barHeight: number;
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

/**
 * One cell of the block's bar: a work or a rest of a round. A cell that is done or held is a plain
 * share (`value`); one running or still ahead fills between `startsAt` and `endsAt` by itself —
 * empty before, full after — so the bar is right with no update from the app.
 */
export type IntervalActivitySegment = {
  work: boolean;
  startsAt?: number;
  endsAt?: number;
  value?: number;
};

/**
 * The whole block, drawn so that the system keeps it right with no update from the app — what the
 * lock screen shows when the app can't reach it. iOS turns down a Live Activity update from an app
 * that is only playing audio in the background (spike on the locked screen, 20.10.2026): the phase
 * may not change on time there, the block's time and its bar always do.
 */
export type IntervalActivityBlock = {
  /** `Heavy bag`. */
  title: string;
  /** `3 rounds`. */
  detail: string;
  /** The block's time left runs down to `endsAt` (from any moment before now: `startedAt`). */
  startedAt: number;
  endsAt: number;
  /** Set while paused: the block's time left, as plain text. */
  pausedLabel?: string;
  segments: IntervalActivitySegment[];
};

export type IntervalTimerActivityProps = {
  look: IntervalActivityLook;
  block: IntervalActivityBlock;
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
    restBarColor: COLORS['text/secondary'],
    segmentGap: SPACING['space/gap-tight'] / 2,
    barHeight: SIZES['size/activity-bar'],
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
  block: IntervalActivityBlock;
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
    block: intervalActivityBlockOf({ exercise, timer }, now),
  });
}

const samePhase = (a: IntervalTimerPhase, b: IntervalTimerPhase) =>
  a.kind === b.kind && a.round === b.round;

/**
 * The block of the timer `active` at `now`: a cell for each work and each rest still to come of the
 * rounds it runs — a Get ready has none — with those before the phase running full.
 */
export function intervalActivityBlockOf(
  { exercise, timer }: ActiveIntervalTimer,
  now: number,
): IntervalActivityBlock {
  const running = isIntervalTimerRunning(timer);
  // Paused, the block is drawn as it would run from now: its time left, its cells held.
  const ahead = intervalPhasesAhead(running ? timer : resumeIntervalTimer(timer, now));
  const current = timer.phase;
  const elapsed = 1 - intervalPhaseProgress(timer, now);
  const last = timer.rounds.length - 1;
  let reached = false;
  const segments: IntervalActivitySegment[] = [];
  const cell = (work: boolean, phase: IntervalTimerPhase) => {
    if (current !== undefined && current.kind === 'getReady' && phase.kind === 'work') {
      reached ||= current.round === phase.round;
    }
    const isCurrent = current !== undefined && samePhase(current, phase);
    reached ||= isCurrent;
    if (!reached) return segments.push({ work, value: 1 });
    if (!running) return segments.push({ work, value: isCurrent ? elapsed : 0 });
    const scheduled = ahead.find((entry) => samePhase(entry.phase, phase));
    return segments.push(
      scheduled === undefined
        ? { work, value: 0 }
        : { work, startsAt: scheduled.startsAt, endsAt: scheduled.endsAt },
    );
  };
  timer.rounds.forEach((round, index) => {
    cell(true, { kind: 'work', round: index });
    if (index < last && round.restSec > 0) cell(false, { kind: 'rest', round: index });
  });
  const endsAt = ahead.at(-1)?.endsAt ?? now;
  const block: IntervalActivityBlock = {
    title: exercise.name,
    detail: `${exercise.totalRounds} rounds`,
    startedAt: Math.min(now, ahead[0]?.startsAt ?? now),
    endsAt,
    segments,
  };
  if (!running) {
    block.pausedLabel = formatClock(Math.max(0, Math.ceil((endsAt - now) / MS_PER_SEC)));
  }
  return block;
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
