// Start — task 042 (04 · Meso Creation Flows, "Запуск (Start)"; 08.3 · Мезоциклы — список,
// Planned → Start). Materializes a planned mesocycle's week 1 and puts it to work. Orchestration
// only, per usecases/README.md — what Start produces (`buildMesocycleStart`) and how a copied
// block's first targets are priced (`prescribeBlockStart`) both stay in `domain/`; this finds the
// reference performance those targets are priced from, which is the part that needs storage.

import { toExerciseId, type Equipment } from '@domain/catalog';
import { NotFoundError } from '@domain/errors';
import type { SetTarget } from '@domain/execution';
import type { Mesocycle } from '@domain/mesocycle';
import { buildMesocycleStart, weekPlanSlotKey, type WeekOneTargets } from '@domain/mesocycleBuilders';
import { prescribeBlockStart } from '@domain/progressionStartReps';
import { targetRir } from '@domain/progressionRir';
import { daysBefore, nowAsUtcIso } from '@domain/time';
import type { LastPerformance } from '@repositories/setLogRepository';
import type { MesocycleStartRepositories, MesocycleStartStore } from '@repositories/mesocycleStart';

export type MesocycleStartDeps = {
  store: MesocycleStartStore;
};

/** Week 1 of a mesocycle is never the deload one — a block is at least 3 weeks long. */
const FIRST_WEEK = 1;

/**
 * Week 1's targets for a `copyWeek` block (04 · Meso Creation Flows, "Расчёт startReps"): per
 * exercise of the plan, the reference performance rule 6 would find — its last non-deload
 * performance within `historyLookbackDays` — re-priced for this block's starting RIR by
 * `prescribeBlockStart`.
 *
 * The source week gave the structure and nothing else. The numbers come from history because
 * copying rarely happens the day the block ended: between that week and this Start the user kept
 * training, and often the week copied isn't even from the last block. So the fresher fact wins.
 *
 * An exercise with no reference is left out of the map entirely — its rows stay bare and the
 * screen shows `N RIR`, the same "не уверен — не рекомендуй" rule as everywhere else. Each
 * exercise is looked up once even when several days share it; `sets` differs per slot, the
 * reference doesn't.
 */
async function weekOneTargetsFromHistory(
  mesocycle: Mesocycle,
  repos: MesocycleStartRepositories,
  now: string,
): Promise<WeekOneTargets> {
  const plan = mesocycle.weekPlan;
  if (!plan) {
    return new Map();
  }
  const exerciseIds = [
    ...new Set(plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId))),
  ];
  const settings = mesocycle.progressionSettings;
  const since = daysBefore(now, settings.historyLookbackDays);

  const references = new Map<string, LastPerformance | null>(
    await Promise.all(
      exerciseIds.map(
        async (exerciseId) =>
          [
            exerciseId,
            await repos.setLogRepo.findLastPerformance({ exerciseId, mesoId: mesocycle.id, since }),
          ] as const,
      ),
    ),
  );
  const catalog = await repos.exerciseRepo.listByIds(exerciseIds.map(toExerciseId));
  const equipmentById = new Map<string, Equipment | undefined>(
    catalog.map((exercise) => [exercise.id as string, exercise.equipment]),
  );

  const startRir = targetRir(mesocycle.lengthWeeks, FIRST_WEEK);
  const targets = new Map<string, SetTarget[]>();
  for (const day of plan.days) {
    for (const exercise of day.exercises) {
      const reference = references.get(exercise.exerciseId);
      if (!reference) {
        continue;
      }
      targets.set(
        weekPlanSlotKey(day.dayNumber, exercise.order),
        prescribeBlockStart(
          reference.setLogs,
          reference.targetRir,
          startRir,
          exercise.sets,
          settings,
          equipmentById.get(exercise.exerciseId),
        ),
      );
    }
  }
  return targets;
}

/**
 * Starts planned mesocycle `id`: in one transaction, creates week 1's sessions and their
 * exercises, then saves the mesocycle as `active` with `startDate = now`. The mesocycle is written
 * last — the order 04 asks of a medium that has to emulate transactions — so no failure can leave
 * it active without its sessions.
 *
 * A `copyWeek` block's week 1 gets its reps and weights here, from each exercise's own history —
 * this is the only place Start reads history, and Flow A and B don't reach it at all.
 *
 * Rejects with `NotFoundError` if `id` doesn't exist, and with `ConflictError` if it isn't
 * `planned`, has no week plan, or another mesocycle is active; nothing is written then.
 */
export async function startMesocycle(
  id: string,
  deps: MesocycleStartDeps,
  now: string = nowAsUtcIso(),
): Promise<Mesocycle> {
  return deps.store.transaction(async (repos) => {
    const mesocycle = await repos.mesocycleRepo.getById(id);
    if (!mesocycle) {
      throw new NotFoundError(`Mesocycle "${id}" does not exist.`);
    }
    const weekOneTargets =
      mesocycle.origin.type === 'copyWeek'
        ? await weekOneTargetsFromHistory(mesocycle, repos, now)
        : undefined;
    const start = buildMesocycleStart(
      mesocycle,
      await repos.mesocycleRepo.getActive(),
      now,
      weekOneTargets,
    );

    await repos.sessionRepo.createMany(start.week.map(({ session }) => session));
    await repos.sessionExerciseRepo.createMany(start.week.flatMap(({ exercises }) => exercises));
    return repos.mesocycleRepo.update(start.mesocycle);
  });
}
