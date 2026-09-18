import { buildNextSession, nextWeekNumber } from '@domain/nextSessionBuilders';
import type { ExercisePrescription } from '@domain/progression';

jest.mock('expo-crypto', () => {
  let counter = 0;
  return { randomUUID: () => `generated-id-${(counter += 1)}` };
});

describe('nextWeekNumber', () => {
  test('a working week is followed by the next one', () => {
    expect(nextWeekNumber({ weekNumber: 2, isDeload: false }, 5)).toBe(3);
  });

  test('the last working week is followed by the deload week', () => {
    expect(nextWeekNumber({ weekNumber: 4, isDeload: false }, 5)).toBe(5);
  });

  test('the deload week has no next week', () => {
    expect(nextWeekNumber({ weekNumber: 5, isDeload: true }, 5)).toBeNull();
  });
});

describe('buildNextSession', () => {
  const prescriptions: ExercisePrescription[] = [
    {
      exerciseId: 'exercise-bench-press',
      order: 1,
      setTargets: [{ setNumber: 1, targetReps: 11, suggestedWeight: 60 }],
      targetRir: 1,
    },
    { exerciseId: 'exercise-row', order: 2, setTargets: [{ setNumber: 1 }], targetRir: 1 },
  ];

  test('a ready, planned session for the same day with the plan’s exercises', () => {
    const draft = buildNextSession({
      trigger: { mesoId: 'meso', dayNumber: 2, name: 'Pull' },
      base: { id: 'session-w2-d2' },
      weekNumber: 3,
      lengthWeeks: 5,
      prescriptions,
    });

    expect(draft.session).toEqual({
      id: expect.any(String) as string,
      mesoId: 'meso',
      weekNumber: 3,
      dayNumber: 2,
      name: 'Pull',
      isDeload: false,
      prescriptionStatus: 'ready',
      status: 'planned',
      sourceSessionId: 'session-w2-d2',
    });
    expect(draft.sessionExercises).toEqual(
      prescriptions.map((prescription) => ({
        ...prescription,
        id: expect.any(String) as string,
        sessionId: draft.session.id,
        status: 'planned',
      })),
    );
    const ids = [draft.session.id, ...draft.sessionExercises.map((exercise) => exercise.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('the block’s last week is the deload session', () => {
    const draft = buildNextSession({
      trigger: { mesoId: 'meso', dayNumber: 1 },
      base: { id: 'session-w4-d1' },
      weekNumber: 5,
      lengthWeeks: 5,
      prescriptions: [],
    });

    expect(draft.session.isDeload).toBe(true);
    expect(draft.session).not.toHaveProperty('name');
  });
});
