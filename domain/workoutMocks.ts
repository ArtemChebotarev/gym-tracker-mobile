// Stub workout sessions — task 091 ("до 042 работать на stub-данных"). Until Start (042) exists,
// nothing in the app creates sessions, so the workout screen (08.7) has nothing to open. These
// cover its three modes on the active mock mesocycle (./mesocycleMocks.ts, 5 weeks × 4 days):
// - Week 1 Day 1 — `completed` → read-only, with the completed check and a full progress bar.
// - Week 2 Day 1 — `in_progress`, 2 of 6 sets logged → live, with a date and a partial bar.
// - Week 3 Day 1 — `awaiting_source` → preview of Week 2 Day 1's exercises.
// The Today tab shows the live one (until 099); the others open through `workoutHref`. Seeded by
// state/workoutStore.ts on demand, not on every workout query. Same role as ./mesocycleMocks.ts: plain data, no side effects, no repository calls.
//
// Dates are relative to `now` so the live session always reads as today.

import type { Session, SessionExercise, SetLog, SetTarget } from './execution';
import { MOCK_MESOCYCLE_IDS } from './mesocycleMocks';

const DAY_MS = 24 * 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

function minutesBefore(now: Date, minutes: number): string {
  return new Date(now.getTime() - minutes * MINUTE_MS).toISOString();
}

/** Stable ids, so seeding twice never duplicates a mock. */
export const MOCK_SESSION_IDS = {
  completed: 'mock-session-w1d1',
  live: 'mock-session-w2d1',
  preview: 'mock-session-w3d1',
} as const;

export type MockWorkout = {
  sessions: Session[];
  sessionExercises: SessionExercise[];
  setLogs: SetLog[];
};

const EXERCISES = ['bench-press-barbell', 'barbell-row-barbell'] as const;

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

export function buildMockWorkout(now: Date): MockWorkout {
  const mesoId = MOCK_MESOCYCLE_IDS.active;
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

  const completedExercises = exercisesOf(MOCK_SESSION_IDS.completed, 'completed', 60, 10);
  const liveExercises = exercisesOf(MOCK_SESSION_IDS.live, 'planned', 62.5, 10);
  const [liveFirst] = liveExercises;

  return {
    sessions: [
      {
        id: MOCK_SESSION_IDS.completed,
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
        id: MOCK_SESSION_IDS.live,
        mesoId,
        weekNumber: 2,
        dayNumber: 1,
        isDeload: false,
        prescriptionStatus: 'ready',
        status: 'in_progress',
        sourceSessionId: MOCK_SESSION_IDS.completed,
        startedAt: minutesBefore(now, 15),
      },
      {
        id: MOCK_SESSION_IDS.preview,
        mesoId,
        weekNumber: 3,
        dayNumber: 1,
        isDeload: false,
        prescriptionStatus: 'awaiting_source',
        status: 'planned',
      },
    ],
    sessionExercises: [...completedExercises, ...liveExercises],
    setLogs: [
      ...completedExercises.flatMap((exercise) =>
        logsOf(exercise, 3, 60, 10, weekAgo.toISOString()),
      ),
      ...(liveFirst ? logsOf(liveFirst, 2, 62.5, 10, minutesBefore(now, 5)) : []),
    ],
  };
}
