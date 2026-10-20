import { formatClock } from '@design/formatClock';
import type { IntervalTimer, IntervalTimerRound } from '@domain/intervalTimer';
import {
  intervalPhaseProgress,
  intervalPhaseRemainingMs,
  intervalPhaseRemainingSec,
  isIntervalTimerRunning,
} from '@domain/intervalTimerRules';
import type { ActiveIntervalTimer } from '@state/intervalTimerStore';

// What the interval timer's screen shows (10.1 FR-6; canvas 2.1–2.4, 6.1, 6.3), worked out from the
// timer and the time. Pure — IntervalTimerScreen.tsx only draws it.

/** What the running time is, for its colour: work and Get ready run orange, a rest grey (canvas 2.2). */
export type TimerTone = 'running' | 'rest' | 'paused';

/** One bar across the top — a round of the exercise. */
export type RoundSegment = { fill: number; tone: 'done' | 'running' | 'paused' | 'empty' };

export type IntervalTimerView = {
  title: string;
  /** `Round 2 of 3`, `Round 2 of 3 done` in its rest, `All rounds done`. */
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
  /** `2 of 2 rounds`. */
  rounds: string;
  /** `4:00 work · 1:00 rest`. */
  totals: string;
};

const MS_PER_SEC = 1000;

function roundOf(timer: IntervalTimer, index: number): IntervalTimerRound | undefined {
  return timer.rounds[index];
}

function phaseName(kind: 'getReady' | 'work' | 'rest'): string {
  return kind === 'getReady' ? 'Get ready' : kind === 'work' ? 'Work' : 'Rest';
}

function nextLine(timer: IntervalTimer): string {
  const phase = timer.phase;
  if (phase === undefined) return '';
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
      if (isLast) return 'Last round. No rest after it.';
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
  const progress = intervalPhaseProgress(timer, now);
  const round = roundOf(timer, phase.round);
  const roundNumber = round?.roundNumber;
  const lastResult = timer.results.at(-1);
  const view: IntervalTimerView = {
    title: exercise.name,
    subtitle:
      phase.kind === 'rest'
        ? `Round ${roundNumber} of ${exercise.totalRounds} done`
        : `Round ${roundNumber} of ${exercise.totalRounds}`,
    segments: segmentsOf(active, progress, paused),
    phase: paused ? `Paused · ${phaseName(phase.kind).toLowerCase()}` : phaseName(phase.kind),
    time: formatClock(intervalPhaseRemainingSec(timer, now)),
    of: `of ${formatClock(Math.round(timer.durationMs / MS_PER_SEC))}`,
    progress,
    tone: paused ? 'paused' : phase.kind === 'rest' ? 'rest' : 'running',
    next: nextLine(timer),
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
  const done = timer.results.filter((result) => result.completed).length;
  const workSec = timer.results.reduce((sum, result) => sum + result.workSec, 0);
  const restSec = timer.results.reduce((sum, result) => sum + (result.restSec ?? 0), 0);
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
  const { timer } = active;
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
