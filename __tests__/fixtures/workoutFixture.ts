// An active mesocycle mid-block, for the Today tab's route tests. The app no longer seeds one —
// an active mesocycle and its sessions come from Start (042) — but the workout screen's modes are
// easiest to exercise on a block already under way, so these tests seed it themselves into the
// app-wide store, the same one the route reads:
// - Upper/Lower, 5 weeks × 4 days.
// - Week 1 Day 1 — `completed` → read-only, with the completed check and a full progress bar.
// - Week 2 Day 1 — `in_progress`, 2 of 6 sets logged → live, with a date and a partial bar.
// Week 3 Day 1 has no session: its grid cell opens a preview of Week 2 Day 1's exercises, and
// finishing Week 2 Day 1 generates it.
//
// Dates are relative to now, so the live session always reads as today. Not a test file itself —
// see `testPathIgnorePatterns` in jest.config.js.

import type { Session, SessionExercise, SetLog, SetTarget } from '@domain/execution';
import { defaultProgressionSettings, type Mesocycle } from '@domain/mesocycle';
import { ensureExerciseCatalogSeeded } from '@state/exerciseLibraryStore';
import { mesocycleListDeps } from '@state/mesocycleStore';
import { workoutStore } from '@state/workoutStore';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

export const WORKOUT_FIXTURE_IDS = {
  mesocycle: 'fixture-mesocycle-active',
  completed: 'fixture-session-w1d1',
  live: 'fixture-session-w2d1',
} as const;

const EXERCISES = ['bench-press-barbell', 'barbell-row-barbell'] as const;

function minutesBefore(date: Date, minutes: number): string {
  return new Date(date.getTime() - minutes * MINUTE_MS).toISOString();
}

function targets(weight: number, reps: number): SetTarget[] {
  return [1, 2, 3].map((setNumber) => ({ setNumber, targetReps: reps, suggestedWeight: weight }));
}

function exercisesOf(
  sessionId: string,
  status: SessionExercise['status'],
  weight: number,
  reps: number,
): SessionExercise[] {
  return EXERCISES.map((exerciseId, index) => ({
    id: `${sessionId}-${exerciseId}`,
    sessionId,
    exerciseId,
    order: index + 1,
    setTargets: targets(weight, reps),
    targetRir: 3,
    status,
  }));
}

function logsOf(
  sessionExercise: SessionExercise,
  count: number,
  weight: number,
  reps: number,
  completedAt: string,
): SetLog[] {
  return sessionExercise.setTargets.slice(0, count).map(({ setNumber }) => ({
    id: `${sessionExercise.id}-log-${setNumber}`,
    sessionExerciseId: sessionExercise.id,
    exerciseId: sessionExercise.exerciseId,
    setNumber,
    weight,
    reps,
    completedAt,
  }));
}

function buildWorkoutFixture(now: Date) {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const mesoId = WORKOUT_FIXTURE_IDS.mesocycle;

  const mesocycle: Mesocycle = {
    id: mesoId,
    name: 'Upper/Lower',
    lengthWeeks: 5,
    daysPerWeek: 4,
    startDate: new Date(now.getTime() - 10 * DAY_MS).toISOString(),
    status: 'active',
    origin: { type: 'scratch' },
    progressionSettings: defaultProgressionSettings,
    createdAt: new Date(now.getTime() - 12 * DAY_MS).toISOString(),
  };

  const completedExercises = exercisesOf(WORKOUT_FIXTURE_IDS.completed, 'completed', 60, 10);
  const liveExercises = exercisesOf(WORKOUT_FIXTURE_IDS.live, 'planned', 62.5, 10);
  const [liveFirst] = liveExercises;

  const sessions: Session[] = [
    {
      id: WORKOUT_FIXTURE_IDS.completed,
      mesoId,
      weekNumber: 1,
      dayNumber: 1,
      isDeload: false,
      prescriptionStatus: 'ready',
      status: 'completed',
      startedAt: minutesBefore(weekAgo, 60),
      completedAt: weekAgo.toISOString(),
    },
    {
      id: WORKOUT_FIXTURE_IDS.live,
      mesoId,
      weekNumber: 2,
      dayNumber: 1,
      isDeload: false,
      prescriptionStatus: 'ready',
      status: 'in_progress',
      sourceSessionId: WORKOUT_FIXTURE_IDS.completed,
      startedAt: minutesBefore(now, 15),
    },
  ];

  const setLogs: SetLog[] = [
    ...completedExercises.flatMap((exercise) => logsOf(exercise, 3, 60, 10, weekAgo.toISOString())),
    ...(liveFirst ? logsOf(liveFirst, 2, 62.5, 10, minutesBefore(now, 5)) : []),
  ];

  return {
    mesocycle,
    sessions,
    sessionExercises: [...completedExercises, ...liveExercises],
    setLogs,
  };
}

let seeded: Promise<void> | null = null;

/**
 * Seeds the fixture into the app-wide store, once per test file (Jest gives each file its own
 * module registry, so its own store). Later calls wait for the first one and write nothing, so the
 * tests of a file share one fixture and see each other's changes to it.
 */
export function seedWorkoutFixture(): Promise<void> {
  if (!seeded) {
    seeded = (async () => {
      await ensureExerciseCatalogSeeded();
      const fixture = buildWorkoutFixture(new Date());
      await mesocycleListDeps.mesocycleRepo.create(fixture.mesocycle);
      const { repos } = workoutStore;
      await repos.sessionRepo.createMany(fixture.sessions);
      await repos.sessionExerciseRepo.createMany(fixture.sessionExercises);
      for (const setLog of fixture.setLogs) {
        await repos.setLogRepo.create(setLog);
      }
    })();
  }
  return seeded;
}
