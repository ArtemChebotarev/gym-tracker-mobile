import { formatClock } from '@design/formatClock';
import type { IntervalTimer, IntervalTimerRound } from '@domain/intervalTimer';
import {
  intervalPhaseProgress,
  intervalPhaseRemainingMs,
  intervalPhaseRemainingSec,
  intervalPhaseShown,
  isIntervalTimerRunning,
} from '@domain/intervalTimerRules';
import type { ActiveIntervalTimer } from '@state/intervalTimerStore';

// What the interval timer's screen shows (10.1 FR-6; canvas 2.1–2.4, 6.1, 6.3), worked out from the
// timer and the time. Pure — IntervalTimerScreen.tsx only draws it.
//
// A mobility block runs on the same timer as one round with no rest (GT-107); its lines speak of
// the block — `Mobility`, `Time`, `Done` — rather than of rounds.

/**
 * What the running time is, for its colour: work and Get ready run orange, a rest grey (canvas
 * 2.2) — until its last seconds, its Get ready (GT-176).
 */
export type TimerTone = 'running' | 'rest' | 'paused';

/** One bar across the top — a round of the exercise. */
export type RoundSegment = { fill: number; tone: 'done' | 'running' | 'paused' | 'empty' };

export type IntervalTimerView = {
  title: string;
  /** `Round 2 of 3`, `Round 2 of 3 done` in its rest, `All rounds done`; `Mobility` for a block. */
  subtitle: string;
  segments: RoundSegment[];
  /** `Get ready`, `Work`, `Rest`; `Paused · work` while paused. */
  phase: string;
  /** `Rest skipped`, in the Get ready after a skipped rest (canvas 2.3). */
  pill?: string;
  /** The time left, `1:24`, and the whole phase, `of 2:00`. */
  time: string;
  of: string;
  /** The share of the dial still to run, 0..1. */
  progress: number;
  /** While running: when the phase ends (epoch ms) — the dial runs down to it smoothly. */
  runsOutAt?: number;
  tone: TimerTone;
  /** What comes after the phase: `Then rest 0:45`, `Next round 3 · 2:00`. */
  next: string;
  paused: boolean;
  canSkipRest: boolean;
};

/** The screen once the block is done (canvas 6.1, frame 6). */
export type IntervalSummaryView = {
  title: string;
  /** `2 of 2 rounds`; `Done` for a mobility block. */
  rounds: string;
  /** `4:00 work · 1:00 rest`. */
  totals: string;
};

const MS_PER_SEC = 1000;

function roundOf(timer: IntervalTimer, index: number): IntervalTimerRound | undefined {
  return timer.rounds[index];
}

const MOBILITY_SUBTITLE = 'Mobility';

function phaseName(kind: 'getReady' | 'work' | 'rest', mobility: boolean): string {
  if (kind === 'getReady') return 'Get ready';
  if (kind === 'rest') return 'Rest';
  return mobility ? 'Time' : 'Work';
}

function nextLine(timer: IntervalTimer, mobility: boolean): string {
  const phase = timer.phase;
  if (phase === undefined) return '';
  if (mobility) {
    return timer.endsAt === undefined ? 'The time goes on from here when you resume.' : '';
  }
  const round = roundOf(timer, phase.round);
  const isLast = phase.round === timer.rounds.length - 1;
  if (timer.endsAt === undefined) {
    return phase.kind === 'work'
      ? 'The round goes on from here when you resume.'
      : phase.kind === 'rest'
        ? 'The rest goes on from here when you resume.'
        : 'The countdown goes on from here when you resume.';
  }
  switch (phase.kind) {
    case 'getReady':
      return round === undefined
        ? ''
        : `Next round ${round.roundNumber} · ${formatClock(round.workSec)}`;
    case 'work':
      // Just that (Artem, 20.10.2026): the rest after it is the rest timer's, after the summary.
      if (isLast) return 'Last round';
      if (round === undefined || round.restSec === 0) {
        const after = roundOf(timer, phase.round + 1);
        return after === undefined ? '' : `Then round ${after.roundNumber}`;
      }
      return `Then rest ${formatClock(round.restSec)}`;
    case 'rest': {
      const after = roundOf(timer, phase.round + 1);
      return after === undefined
        ? ''
        : `Next round ${after.roundNumber} · ${formatClock(after.workSec)}`;
    }
  }
}

function segmentsOf(
  { exercise, timer }: ActiveIntervalTimer,
  progress: number,
  paused: boolean,
): RoundSegment[] {
  const done = new Set(exercise.loggedRoundNumbers);
  for (const result of timer.results) {
    done.add(result.roundNumber);
  }
  const phase = timer.phase;
  const working = phase?.kind === 'work' ? roundOf(timer, phase.round)?.roundNumber : undefined;
  return Array.from({ length: exercise.totalRounds }, (_, index) => {
    const roundNumber = index + 1;
    if (roundNumber === working) {
      return { fill: 1 - progress, tone: paused ? 'paused' : 'running' };
    }
    return done.has(roundNumber) ? { fill: 1, tone: 'done' } : { fill: 0, tone: 'empty' };
  });
}

/** The running or paused screen; `undefined` once the block is over. */
export function intervalTimerView(
  active: ActiveIntervalTimer,
  now: number,
): IntervalTimerView | undefined {
  const { exercise, timer } = active;
  const phase = timer.phase;
  if (phase === undefined) return undefined;
  const paused = !isIntervalTimerRunning(timer);
  // A rest's last seconds read as Get ready; the rest's own lines — the round done, what is next,
  // Skip rest — stay.
  const shown = intervalPhaseShown(timer, now) ?? {
    kind: phase.kind,
    durationMs: timer.durationMs,
  };
  const progress = intervalPhaseProgress(timer, now);
  const round = roundOf(timer, phase.round);
  const roundNumber = round?.roundNumber;
  const lastResult = timer.results.at(-1);
  const mobility = exercise.type === 'mobility';
  const name = phaseName(shown.kind, mobility);
  const view: IntervalTimerView = {
    title: exercise.name,
    subtitle: mobility
      ? MOBILITY_SUBTITLE
      : phase.kind === 'rest'
        ? `Round ${roundNumber} of ${exercise.totalRounds} done`
        : `Round ${roundNumber} of ${exercise.totalRounds}`,
    segments: segmentsOf(active, progress, paused),
    phase: paused ? `Paused · ${name.toLowerCase()}` : name,
    time: formatClock(intervalPhaseRemainingSec(timer, now)),
    of: `of ${formatClock(Math.round(shown.durationMs / MS_PER_SEC))}`,
    progress,
    tone: paused ? 'paused' : shown.kind === 'rest' ? 'rest' : 'running',
    next: nextLine(timer, mobility),
    paused,
    canSkipRest: phase.kind === 'rest',
  };
  if (!paused && timer.endsAt !== undefined) {
    view.runsOutAt = timer.endsAt;
  }
  if (phase.kind === 'getReady' && lastResult?.restSkipped === true) {
    view.pill = 'Rest skipped';
  }
  return view;
}

/** The summary once every round is done; `undefined` while the block runs. */
export function intervalSummaryView({
  exercise,
  timer,
}: ActiveIntervalTimer): IntervalSummaryView | undefined {
  if (timer.outcome !== 'done') return undefined;
  if (exercise.type === 'mobility') {
    const workSec = timer.results.reduce((sum, result) => sum + result.workSec, 0);
    return { title: exercise.name, rounds: 'Done', totals: formatClock(workSec) };
  }
  const done = timer.results.filter((result) => result.completed).length;
  const workSec = timer.results.reduce((sum, result) => sum + result.workSec, 0);
  // The last round's rest is still to come — the rest timer's, after this screen — so it is not
  // part of what the block took.
  const lastRound = timer.rounds.at(-1)?.roundNumber;
  const restSec = timer.results
    .filter((result) => result.roundNumber !== lastRound)
    .reduce((sum, result) => sum + (result.restSec ?? 0), 0);
  return {
    title: exercise.name,
    rounds: `${done} of ${timer.rounds.length} ${timer.rounds.length === 1 ? 'round' : 'rounds'}`,
    totals:
      restSec > 0
        ? `${formatClock(workSec)} work · ${formatClock(restSec)} rest`
        : `${formatClock(workSec)} work`,
  };
}

function roundList(numbers: readonly number[]): string {
  const first = numbers[0];
  const last = numbers.at(-1);
  if (first === undefined || last === undefined) return '';
  return numbers.length === 1 ? `Round ${first} is` : `Rounds ${first}–${last} are`;
}

/**
 * What End early's confirmation says goes into the log (canvas 6.3, B): the rounds already done,
 * and what the one running will be logged as.
 */
export function endEarlyMessage(active: ActiveIntervalTimer, now: number): string {
  const { exercise, timer } = active;
  const lines: string[] = [];
  const done = timer.results.map((result) => result.roundNumber);
  if (done.length > 0) {
    lines.push(`${roundList(done)} in the log.`);
  }
  const phase = timer.phase;
  const round = phase === undefined ? undefined : roundOf(timer, phase.round);
  if (phase?.kind === 'work' && round !== undefined) {
    const ranSec = Math.round(
      (timer.durationMs - intervalPhaseRemainingMs(timer, now)) / MS_PER_SEC,
    );
    if (exercise.type === 'mobility') {
      return ranSec >= 1
        ? `It will be logged as ${formatClock(ranSec)} of ${formatClock(round.workSec)}.`
        : 'It has not started, so it won’t be logged.';
    }
    lines.push(
      ranSec >= 1
        ? `Round ${round.roundNumber} will be logged as ${formatClock(ranSec)} of ${formatClock(round.workSec)}.`
        : `Round ${round.roundNumber} has not started, so it won’t be logged.`,
    );
  }
  if (lines.length === 0) {
    lines.push('Nothing has been logged yet.');
  }
  return lines.join(' ');
}
