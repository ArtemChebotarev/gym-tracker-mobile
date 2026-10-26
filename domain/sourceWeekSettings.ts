// Flow C: a hybrid exercise's settings as the copied week left them (04 · Meso Creation Flows,
// "Что копируется"; Artem, 26.10.2026). For an interval its rounds, work and rest are structure,
// not a target: the copy starts from the week as it ended, the editor shows exactly that, and
// Start lays week 1 out from it without re-pricing anything — no lever step across blocks. What
// each type takes from the week is its own; a type with nothing to take keeps the cycle's
// settings. Pure.

import type { RoundLog, SessionExercise } from '@domain/execution';
import type { ExerciseSettings, IntervalPlanConfig } from '@domain/exerciseConfig';
import { inheritedIntervalRounds, intervalLogsByRound } from '@domain/progressionRoundsInterval';

/** One performance of the exercise in the copied week, with the rounds logged in it. */
export type SourceWeekPerformance = {
  sessionExercise: Pick<SessionExercise, 'id' | 'setTargets'>;
  roundLogs: readonly RoundLog[];
};

type FromWeek<S extends ExerciseSettings> = (settings: S, performance: SourceWeekPerformance) => S;

const keep = <S extends ExerciseSettings>(settings: S): S => settings;

/**
 * An interval as the week ended: as many rounds as it had, with the times each hands on to the
 * week after it (a skipped rest or a round ended early keeps its planned time, `roundTimesOf`).
 * A cycle holds one work and one rest for all rounds; where the rounds differ, the last round's
 * win — an edit on the card carries down to the rounds below it, so the last round holds the
 * latest one (Artem, 26.10.2026).
 */
const intervalFromWeek: FromWeek<IntervalPlanConfig> = (
  settings,
  { sessionExercise, roundLogs },
) => {
  const rounds = inheritedIntervalRounds(
    sessionExercise.setTargets,
    intervalLogsByRound(sessionExercise, roundLogs),
  );
  const last = rounds.at(-1);
  if (last === undefined) {
    return settings;
  }
  return {
    ...settings,
    rounds: rounds.length,
    workSec: last.targetWorkSec ?? settings.workSec,
    restSec: last.targetRestSec ?? settings.restSec,
  };
};

const FROM_WEEK: {
  [T in ExerciseSettings['type']]: FromWeek<Extract<ExerciseSettings, { type: T }>>;
} = {
  power: keep,
  interval: intervalFromWeek,
  mobility: keep,
};

/** `settings` with what the copied week's `performance` of the exercise says about them. */
export function settingsFromSourceWeek(
  settings: ExerciseSettings,
  performance: SourceWeekPerformance,
): ExerciseSettings {
  const fromWeek = FROM_WEEK[settings.type] as FromWeek<ExerciseSettings>;
  return fromWeek(settings, performance);
}

/**
 * Each exercise's settings in `settings` with what the copied week says about them. `performances`
 * are the week's in day order; an exercise done on more than one day takes the last of them, the
 * freshest. An exercise with no settings (a strength one) is passed by.
 */
export function exerciseSettingsFromSourceWeek(
  settings: Readonly<Record<string, ExerciseSettings>>,
  performances: readonly (SourceWeekPerformance & { exerciseId: string })[],
): Record<string, ExerciseSettings> {
  const result = { ...settings };
  const lastByExercise = new Map(
    performances.map((performance) => [performance.exerciseId, performance]),
  );
  for (const [exerciseId, performance] of lastByExercise) {
    const own = settings[exerciseId];
    if (own !== undefined) {
      result[exerciseId] = settingsFromSourceWeek(own, performance);
    }
  }
  return result;
}
