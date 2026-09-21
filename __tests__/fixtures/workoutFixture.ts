// An active mesocycle mid-block, for the Today tab's route tests. The app no longer seeds one —
// an active mesocycle and its sessions come from Start (042) — but the workout screen's modes are
// easiest to exercise on a block already under way, so these tests seed it themselves into the
// store the route reads:
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
import type { RepositorySet } from '@repositories/repositorySet';

import { seedExerciseCatalog } from './appStorage';
import { STAMPS } from './stamps';

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
    ...STAMPS,
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
    ...STAMPS,
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
    ...STAMPS,
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
      ...STAMPS,
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
      ...STAMPS,
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

/**
 * Seeds the fixture into `repositories` — the store of the test about to run (task 115). It used
 * to be written once per test file and shared by its tests, which meant a test could see what an
 * earlier one had changed; now every test starts from the same fixture in an empty store.
 */
export async function seedWorkoutFixture(repositories: RepositorySet): Promise<void> {
  await seedExerciseCatalog(repositories);
  const fixture = buildWorkoutFixture(new Date());
  await repositories.mesocycleRepo.create(fixture.mesocycle);
  const { repos } = repositories.workoutStore;
  await repos.sessionRepo.createMany(fixture.sessions);
  await repos.sessionExerciseRepo.createMany(fixture.sessionExercises);
  for (const setLog of fixture.setLogs) {
    await repos.setLogRepo.create(setLog);
  }
}

/**
 * One more day of the fixture's mesocycle, with a single bench-press row — what a test needs when
 * it is about the *other* day: the conflict alert while Week 2 Day 1 is in progress, `Next
 * workout`'s pick, or a skipped day opening read-only. Every test that wants one seeds it itself,
 * rather than inheriting the one an earlier test left behind (task 115).
 */
export async function seedFixtureDay(
  repositories: RepositorySet,
  day: {
    id: string;
    weekNumber: number;
    dayNumber: number;
    status?: Session['status'];
  },
): Promise<void> {
  const status = day.status ?? 'planned';
  const { repos } = repositories.workoutStore;
  await repos.sessionRepo.create({
    id: day.id,
    mesoId: WORKOUT_FIXTURE_IDS.mesocycle,
    weekNumber: day.weekNumber,
    dayNumber: day.dayNumber,
    isDeload: false,
    prescriptionStatus: 'ready',
    status,
  });
  await repos.sessionExerciseRepo.create({
    id: `${day.id}-bench`,
    sessionId: day.id,
    exerciseId: 'bench-press-barbell',
    order: 1,
    setTargets: [{ setNumber: 1, targetReps: 10, suggestedWeight: 60 }],
    targetRir: 3,
    status: status === 'skipped' ? 'skipped' : 'planned',
  });
}
