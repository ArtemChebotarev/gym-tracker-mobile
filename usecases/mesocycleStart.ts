// Start — task 042 (04 · Meso Creation Flows, "Запуск (Start)"; 08.3 · Мезоциклы — список,
// Planned → Start). Materializes a planned mesocycle's week 1 and puts it to work. Orchestration
// only, per usecases/README.md — what Start produces (`buildMesocycleStart`) and how a copied
// block's first targets are priced (`prescribeBlockStart`, from the reference resolver's answer)
// stay in `domain/`; this reads the history window they are priced from, the part that needs
// storage.

import { toExerciseId, type Equipment } from '@domain/catalog';
import { NotFoundError } from '@domain/errors';
import type { SetTarget } from '@domain/execution';
import type { Mesocycle, MesocycleOrigin } from '@domain/mesocycle';
import {
  buildMesocycleStart,
  weekPlanSlotKey,
  type WeekOneTargets,
} from '@domain/mesocycleBuilders';
import { validateMesocycleCanStart, type StartableMesocycle } from '@domain/mesocycleValidators';
import type { ExercisePerformance } from '@domain/progression';
import { resolveReference } from '@domain/progressionReference';
import { prescribeBlockStart } from '@domain/progressionStartReps';
import { targetRir } from '@domain/progressionRir';
import { daysBefore, nowAsUtcIso } from '@domain/time';
import type { MesocycleStartRepositories, MesocycleStartStore } from '@repositories/mesocycleStart';

export type MesocycleStartDeps = {
  store: MesocycleStartStore;
};

/** Week 1 of a mesocycle is never the deload one — a block is at least 3 weeks long. */
const FIRST_WEEK = 1;

/**
 * Week 1's targets for a `copyWeek` block (04 · Meso Creation Flows, "Расчёт startReps"): per
 * slot of the plan, the reference the resolver finds for that day (`resolveReference`, task
 * 134.2) among the exercise's performances inside `historyLookbackDays`, re-priced for this
 * block's starting RIR by `prescribeBlockStart`.
 *
 * The source week gave the structure and nothing else. The numbers come from history because
 * copying rarely happens the day the block ended: between that week and this Start the user kept
 * training, and often the week copied isn't even from the last block. So the fresher fact wins.
 *
 * The slot the resolver is asked about is the day in the block being copied — the "own"
 * mesocycle is the source one, since the new block has no history yet — and no current week: the
 * reference week is simply the latest one in the window. So an exercise done twice a week gets
 * each day's own numbers, one placed on a day it wasn't done on gets an estimate, and one whose
 * latest week is from another split gets an estimate or nothing (cases C1–C7 of 03, rule 6).
 *
 * A slot with no reference is left out of the map entirely — its rows stay bare and the screen
 * shows `N RIR`, the same "не уверен — не рекомендуй" rule as everywhere else. History is read
 * once per exercise even when several days share it; the resolver runs per day.
 *
 * Only reached once `validateMesocycleCanStart` has passed, so the plan is there and the queries
 * below are never run for a launch that is going to be refused.
 */
async function weekOneTargetsFromHistory(
  mesocycle: StartableMesocycle & { origin: Extract<MesocycleOrigin, { type: 'copyWeek' }> },
  repos: MesocycleStartRepositories,
  now: string,
): Promise<WeekOneTargets> {
  const plan = mesocycle.weekPlan;
  const exerciseIds = [
    ...new Set(plan.days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId))),
  ];
  const settings = mesocycle.progressionSettings;
  const since = daysBefore(now, settings.historyLookbackDays);

  const performances = new Map<string, ExercisePerformance[]>(
    await Promise.all(
      exerciseIds.map(
        async (exerciseId) =>
          [exerciseId, await repos.setLogRepo.listPerformances({ exerciseId, since })] as const,
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
      const resolution = resolveReference(performances.get(exercise.exerciseId) ?? [], {
        mesoId: mesocycle.origin.sourceMesoId,
        dayNumber: day.dayNumber,
      });
      if (resolution.kind === 'none') {
        continue;
      }
      targets.set(
        weekPlanSlotKey(day.dayNumber, exercise.order),
        prescribeBlockStart(
          resolution,
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
 * Whether the launch may happen at all is settled first, by `validateMesocycleCanStart`: the
 * history read that follows is one query per exercise, and a Start that was going to be refused
 * shouldn't run any of them.
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
    const active = await repos.mesocycleRepo.getActive();
    validateMesocycleCanStart(mesocycle, active);

    const { origin } = mesocycle;
    const weekOneTargets =
      origin.type === 'copyWeek'
        ? await weekOneTargetsFromHistory({ ...mesocycle, origin }, repos, now)
        : undefined;
    const start = buildMesocycleStart(mesocycle, active, now, weekOneTargets);

    await repos.sessionRepo.createMany(start.week.map(({ session }) => session));
    await repos.sessionExerciseRepo.createMany(start.week.flatMap(({ exercises }) => exercises));
    return repos.mesocycleRepo.update(start.mesocycle);
  });
}
