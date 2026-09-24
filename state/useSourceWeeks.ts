// Reads what Flow C's step S needs (08.8 · Редактор мезоцикла — Flow C, task 124) through the
// usecase layer via TanStack Query: which weeks of a finished block may be copied, and the plan of
// the one that is.
//
// Two queries rather than one because they are needed at different moments and cost differently.
// The week list is sessions only and is what the step renders; the week plan additionally reads
// every session's exercises, and only ever for the one week actually selected. Both are keyed by
// what they read, so switching the mesocycle dropdown back and forth re-renders from cache.
//
// Neither is invalidated by anything: a finished block never changes again (its status is final,
// 02 · Domain Model), so there is nothing here that can go stale while the step is open.

import { useQuery } from '@tanstack/react-query';

import { extractSourceWeekPlan, listSourceWeeks } from '@usecases/mesocycleCreation';

import { useSourceWeekDeps, useSourceWeekListDeps } from './mesocycleStore';

export const SOURCE_WEEKS_QUERY_KEY = ['sourceWeeks'] as const;
export const SOURCE_WEEK_PLAN_QUERY_KEY = ['sourceWeekPlan'] as const;

/** The copyable weeks of `mesoId`; idle while `mesoId` is `undefined` (nothing selected yet). */
export function useSourceWeeks(mesoId: string | undefined) {
  const deps = useSourceWeekListDeps();

  return useQuery({
    queryKey: [...SOURCE_WEEKS_QUERY_KEY, mesoId],
    queryFn: async () => {
      if (mesoId === undefined) {
        throw new Error('useSourceWeeks ran without a mesocycle id.');
      }
      return listSourceWeeks(mesoId, deps);
    },
    enabled: mesoId !== undefined,
  });
}

/**
 * The structure of week `weekNumber` of `mesoId`, ready for the draft to be prefilled from. Idle
 * until both are known.
 *
 * Fetched as soon as a week is selected rather than on Continue, so pressing Continue is instant
 * and the step never has a pending button of its own — 08.8 asks for a Continue that is simply
 * always there. It is disabled for as long as this hasn't arrived, which on a local database is
 * a frame or two, because prefilling the draft is the whole of what Continue does.
 */
export function useSourceWeekPlan(mesoId: string | undefined, weekNumber: number | undefined) {
  const deps = useSourceWeekDeps();

  return useQuery({
    queryKey: [...SOURCE_WEEK_PLAN_QUERY_KEY, mesoId, weekNumber],
    queryFn: async () => {
      if (mesoId === undefined || weekNumber === undefined) {
        throw new Error('useSourceWeekPlan ran without a mesocycle id and week number.');
      }
      return extractSourceWeekPlan({ sourceMesoId: mesoId, sourceWeekNumber: weekNumber }, deps);
    },
    enabled: mesoId !== undefined && weekNumber !== undefined,
  });
}
